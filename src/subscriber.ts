import express, { NextFunction, Request, Response, Express } from "express";
import {
  Config,
  Context,
  ControllerFn,
  defaultControllerFn,
  DirectoryItem,
  DirectverRequest,
  DirectverResponse,
  FileItem,
  FileType,
  GuardFn,
  HttpError,
  LazyInject,
  OutFn,
} from "./config";
import {
  criticalErrorHandler,
  fromFilesToSplitFiles,
  isFunction,
} from "./util/common";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import {
  basicErrorHandler,
  finalErrorHandler,
  inject__directver,
  notFoundHandler,
  responser,
} from "./middlewares";
import { log, LogName, LogType } from "./util/log";
import { join } from "node:path";
import { pathToRegexp } from "path-to-regexp";

const _express = express();

export type SplittedFiles = {
  CONTROLLER: FileItem[];
  PIPE: FileItem[];
  GUARD: FileItem[];
  OUT: FileItem[];
};

export function subscribe(rootDirectoryItem: DirectoryItem): Express {
  const outs = [];
  injectNecessaryMiddlewares();

  const openDirectoryItems = [rootDirectoryItem];
  let activeDirectoryItem = rootDirectoryItem;

  while (activeDirectoryItem) {
    if (activeDirectoryItem.cursor.index === 0) {
      const splittedFiles = fromFilesToSplitFiles(activeDirectoryItem.files);
      subscribeGuards(activeDirectoryItem, splittedFiles.GUARD);
      subscribePipes(activeDirectoryItem, splittedFiles.PIPE);
      subscribeControllers(activeDirectoryItem, splittedFiles.CONTROLLER);
      outs.push(...subscribeOuts(activeDirectoryItem, splittedFiles.OUT));
    }

    if (
      activeDirectoryItem.cursor.index >=
      activeDirectoryItem.subdirectorieNames.length
    ) {
      openDirectoryItems.pop();
      activeDirectoryItem = openDirectoryItems[openDirectoryItems.length - 1];
      continue;
    }

    openDirectoryItems.push(
      activeDirectoryItem.subdirectories[activeDirectoryItem.cursor.index++]
    );
    activeDirectoryItem = openDirectoryItems[openDirectoryItems.length - 1];
  }

  subscribeLazyInjects(outs.reverse());
  injectEndingMiddlewares();
  return _express;
}

function injectNecessaryMiddlewares() {
  _express.use(bodyParser.json());
  _express.use(bodyParser.urlencoded({ extended: false }));
  _express.use(cookieParser());
  _express.use(inject__directver);
}

function injectEndingMiddlewares() {
  _express.all("*", notFoundHandler);
  _express.use(responser);
  _express.use(basicErrorHandler);
  _express.use(finalErrorHandler);
}

function subscribeGuards(directoryItem: DirectoryItem, fileItems: FileItem[]) {
  for (const file of fileItems) {
    const path = file.directoryItem.routePath;
    const method = file.descriptor.method;
    const cover = file.descriptor.cover;
    const fn: ControllerFn = isFunction(file?.exported?.default)
    ? (file?.exported?.default as GuardFn)
    : defaultControllerFn;
  
    if (fn === defaultControllerFn) {
      return criticalErrorHandler(
        new Error(
          `Guard "${join(
            directoryItem.relativePath,
            file.fullName
          )}" doesn't export a function`
        )
      );
    }

    const expressFnName = (
      cover ? "use" : method ? method.toLowerCase() : "all"
    ) as keyof typeof _express;

    const wrapper = async function (
      req: DirectverRequest,
      res: Response,
      next: NextFunction
    ) {
      let response: boolean | Promise<boolean>;
      // should be changed
      if (expressFnName === "use" && method !== "ALL") {
        if (req.method !== method.toUpperCase()) return next();
      }
      try {
        response = fn(req.__directver.context);
        if (response instanceof Promise) {
          response = await response;
        }
      } catch (err) {
        return next(err);
      }

      if (response) return next();
      return next(new HttpError(403, "You don't have access to this route"));
    };

    log(
      `${file?.descriptor?.method?.toUpperCase().padEnd(5)} "${path}"`,
      LogName.GUARD
    );
    _express[expressFnName](
      path,
      wrapper //expressFnName === "use" ? methodizeUse(wrapper, method) : wrapper
    );
  }
}

function subscribePipes(directoryItem: DirectoryItem, fileItems: FileItem[]) {
  for (const file of fileItems) {
    const path = file.directoryItem.routePath;
    const method = file.descriptor.method;
    const cover = file.descriptor.cover;
    const fn: ControllerFn = isFunction(file?.exported?.default)
      ? (file?.exported?.default as ControllerFn)
      : defaultControllerFn;

    if (fn === defaultControllerFn) {
      return criticalErrorHandler(
        new Error(
          `Pipe "${join(
            directoryItem.relativePath,
            file.fullName
          )}" doesn't export a function`
        )
      );
    }
    const expressFnName = (
      cover ? "use" : method ? method.toLowerCase() : "all"
    ) as keyof typeof _express;

    const wrapper = async function (
      req: DirectverRequest,
      res: Response,
      next: NextFunction
    ) {
      let response: void | Promise<void>;
      // should be changed
      if (expressFnName === "use" && method !== "ALL") {
        if (req.method !== method.toUpperCase()) return next();
      }
      try {
        response = fn(req.__directver.context);
        if (response instanceof Promise) {
          response = await response;
        }
      } catch (err) {
        return next(err);
      }

      return next();
    };

    log(
      `${file?.descriptor?.method?.toUpperCase().padEnd(5)} "${path}"`,
      LogName.PIPE
    );
    _express[expressFnName](
      path,
      wrapper //expressFnName === "use" ? methodizeUse(wrapper, method) : wrapper
    );
  }
}

function subscribeControllers(
  directoryItem: DirectoryItem,
  controllers: FileItem[]
) {
  for (const file of controllers) {
    const path = file.directoryItem.routePath;
    const method = file.descriptor.method;
    //console.log(file);
    const fn: ControllerFn = isFunction(file?.exported?.default)
      ? (file?.exported?.default as ControllerFn)
      : defaultControllerFn;

    if (fn === defaultControllerFn && !Config.USE_DEFAULT_CONTROLLER_FN) {
      return criticalErrorHandler(
        new Error(
          `Controller in "${directoryItem.relativePath}" doesn't export a function`
        )
      );
    }
    const expressFnName = (
      method ? method.toLowerCase() : "all"
    ) as keyof typeof _express;

    const wrapper = async function (
      req: DirectverRequest,
      res: Response,
      next: NextFunction
    ) {
      let response: any | Promise<any>;

      try {
        response = fn(req.__directver.context);
        if (response instanceof Promise) {
          response = await response;
        }
      } catch (err) {
        return next(err);
      }

      // check empty resposne
      if (!response) response = {};
      return next(new DirectverResponse(response, req));
    };

    log(
      `${file?.descriptor?.method?.toUpperCase().padEnd(5)} "${path}"`,
      LogName.ROUTE
    );
    //console.log(path, wrapper, expressFnName);
    _express[expressFnName](path, wrapper);
  }
}

export function subscribeOuts(
  directoryItem: DirectoryItem,
  fileItems: FileItem[]
): LazyInject[] {
  return fileItems.map((file) => {
    //console.log(file.descriptor);
    const path = file.directoryItem.routePath;
    const method = file.descriptor.method.toLowerCase();
    const cover = file.descriptor.cover;
    const fn: OutFn = isFunction(file?.exported?.default)
      ? (file?.exported?.default as OutFn)
      : defaultControllerFn;

    if (fn === defaultControllerFn) {
      return criticalErrorHandler(
        new Error(
          `Out "${join(
            directoryItem.relativePath,
            file.fullName
          )}" doesn't export a function`
        )
      );
    }
    const expressFnName = "use" as keyof typeof _express;

    const wrapper = async function (
      __unknown: any,
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      if (!(__unknown instanceof DirectverResponse)) return next(__unknown);
      if (method !== "all") {
        if (req.method !== method.toUpperCase()) return next(__unknown);
      }
      const directverResponse = __unknown;
      let response: any | Promise<any>;
      try {
        response = fn(directverResponse);
        if (fn instanceof Promise) {
          /**
           * there is no check for undefined response in out method
           * this feature is for a empty response!
           */
          response = await response;
        }
      } catch (err) {
        return next(err);
      }

      directverResponse.data = response;
      return next(directverResponse);
    };

    return new LazyInject(
      expressFnName,
      cover ? path : pathToRegexp(path), // exact path not working all the outs are cover at this point TODO
      path,
      file.descriptor.type,
      method,
      wrapper
    );
  }) as LazyInject[];
}

function subscribeLazyInjects(lazyInjects: LazyInject[]) {
  for (const lazyInject of lazyInjects) {
    //console.log(lazyInject.fn.toString(), lazyInject);
    log(
      `${lazyInject.method?.toUpperCase().padEnd(5)} "${
        lazyInject.originalPath
      }"`,
      lazyInject.type === FileType.OUT && LogName.OUT
    );
    _express[lazyInject.expressFnName](lazyInject.path, lazyInject.fn);
  }
}
