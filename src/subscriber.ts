import express, { NextFunction, Request, Response, Express } from "express";
import { Config, Context, ControllerFn, defaultControllerFn, DirectoryItem, DirectverRequest, DirectverResponse, FileItem, FileType, LazyInject, OutFn } from "./config";
import { criticalErrorHandler, fromFilesToSplitFiles, isFunction, methodizeUse } from "./util/common";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { inject__directver, responser } from "./middlewares";
import { log, LogName, LogType } from "./util/log";
import { join } from "node:path";
import { pathToRegexp } from "path-to-regexp";

const _express = express();

export type SplittedFiles = {
  CONTROLLER: FileItem[],
  PIPE: FileItem[],
  GUARD: FileItem[],
  OUT: FileItem[]
}

export function subscribe(rootDirectoryItem: DirectoryItem): Express{
  const outs = [];
  injectNecessaryMiddlewares();

  const openDirectoryItems = [rootDirectoryItem];
  let activeDirectoryItem = rootDirectoryItem;

  while(activeDirectoryItem) {
    if (activeDirectoryItem.cursor.index === 0) {

      const splittedFiles = fromFilesToSplitFiles(activeDirectoryItem.files);
      subscribePipes(activeDirectoryItem, splittedFiles.PIPE);
      subscribeControllers(activeDirectoryItem, splittedFiles.CONTROLLER);
      outs.push(...subscribeOuts(activeDirectoryItem, splittedFiles.OUT));
      
    }

    if (activeDirectoryItem.cursor.index >= activeDirectoryItem.subdirectorieNames.length) {
      openDirectoryItems.pop();
      activeDirectoryItem = openDirectoryItems[openDirectoryItems.length - 1];
      continue
    }
    
    openDirectoryItems.push(activeDirectoryItem.subdirectories[activeDirectoryItem.cursor.index++]);
    activeDirectoryItem = openDirectoryItems[openDirectoryItems.length - 1];
  }

  subscribeLazyInjects(outs.reverse());
  injectEndingMiddlewares();
  return _express;
}

function injectNecessaryMiddlewares() {
  _express.use(bodyParser.json());
  _express.use(bodyParser.urlencoded({extended: false}));
  _express.use(cookieParser());
  _express.use(inject__directver);
}

function injectEndingMiddlewares() {
  _express.use(responser);
}

function subscribePipes(directoryItem: DirectoryItem, fileItems: FileItem[]) {
  for (const file of fileItems) {
    const path = file.directoryItem.routePath;
    const method = file.descriptor.method;
    const cover = file.descriptor.cover;
    const fn: ControllerFn = isFunction(file?.exported?.default) 
      ? file?.exported?.default as ControllerFn 
      : defaultControllerFn;
    
    if (fn === defaultControllerFn) {
      return criticalErrorHandler(new Error(`Pipe "${join(directoryItem.relativePath, file.fullName)}" doesn't export a function`))
    }
    const expressFnName = (cover ? "use" : method ? method.toLowerCase() : "all") as keyof typeof _express;

    const wrapper = async function(req: DirectverRequest, res: Response, next: NextFunction) {
      let response: void | Promise<void> = fn(req.__directver.context);
      if (response instanceof Promise) {
        response = await response;
      }

      return next();
    }

    log(`${file?.descriptor?.method?.toUpperCase().padEnd(5)} "${path}"`, LogName.PIPE);
    _express[expressFnName](path, expressFnName === "use" ? methodizeUse(wrapper, method) : wrapper);
  }
}

function subscribeControllers(directoryItem: DirectoryItem, controllers: FileItem[]) {
  for (const file of controllers) {
    const path = file.directoryItem.routePath;
    const method = file.descriptor.method;

    const fn: ControllerFn = isFunction(file?.exported?.default) 
      ? file?.exported?.default as ControllerFn 
      : defaultControllerFn;
    
    if (fn === defaultControllerFn && !Config.USE_DEFAULT_CONTROLLER_FN) {
      return criticalErrorHandler(new Error(`Controller in "${directoryItem.relativePath}" doesn't export a function`))
    }
    const expressFnName = (method ? method.toLowerCase() : "all") as keyof typeof _express;

    const wrapper = async function(req: DirectverRequest, res: Response, next: NextFunction) {
      let response: any = fn(req.__directver.context);
      if (response instanceof Promise) {
        response = await response;
      }

      // check empty resposne
      if (!response) response = {};
      return next(new DirectverResponse(response, req));
    }

    log(`${file?.descriptor?.method?.toUpperCase().padEnd(5)} "${path}"`, LogName.ROUTE);
    _express[expressFnName](path, wrapper);
  }
}

export function subscribeOuts(directoryItem: DirectoryItem, fileItems: FileItem[]): LazyInject[] {
  return fileItems.map(file => {
    const path = file.directoryItem.routePath;
    const method = file.descriptor.method;
    const cover = file.descriptor.cover;
    const fn: OutFn = isFunction(file?.exported?.default) 
      ? file?.exported?.default as OutFn 
      : defaultControllerFn;
    
    if (fn === defaultControllerFn) {
      return criticalErrorHandler(new Error(`Out "${join(directoryItem.relativePath, file.fullName)}" doesn't export a function`))
    }
    const expressFnName = "use" as keyof typeof _express;

    const wrapper = async function (__unknown: any, req: Request, res: Response, next: NextFunction) {
      if (!(__unknown instanceof DirectverResponse)) return next(__unknown);
      const directverResponse = __unknown;
      let response = fn(directverResponse.data);
      if (fn instanceof Promise) {
        /**
         * there is no check for undefined response in out method
         * this feature is for a empty response!
         */
        response = await response;
      }
      
      directverResponse.data = response;
      return next(directverResponse);
    }

    return new LazyInject(
      expressFnName,
      cover ? path : pathToRegexp(path), // exact path not working all the outs are cover at this point TODO
      file.descriptor.type,
      file.descriptor.method,
      method !== "all" ? methodizeUse(wrapper, method, true) : wrapper,
    )
  }) as LazyInject[];
}

function subscribeLazyInjects(lazyInjects: LazyInject[]) {
  for (const lazyInject of lazyInjects) {
    log(`${lazyInject.method?.toUpperCase().padEnd(5)} "${lazyInject.path}"`, lazyInject.type === FileType.OUT && LogName.OUT);
    _express[lazyInject.expressFnName](lazyInject.path, lazyInject.fn);
  }
}