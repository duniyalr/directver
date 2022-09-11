import express, { NextFunction, Request, Response, Express } from "express";
import { Config, Context, ControllerFn, defaultControllerFn, DirectoryItem, DirectverRequest, DirectverResponse, FileItem } from "./config";
import { criticalErrorHandler, fromFilesToSplitFiles, isFunction } from "./util/common";
import * as bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { inject__directver, responser } from "./middlewares";
import { log, LogName } from "./util/log";

const _express = express();

export type SplittedFiles = {
  CONTROLLER: FileItem[],
  PIPE: FileItem[],
  GUARD: FileItem[]
}

export function subscribe(rootDirectoryItem: DirectoryItem): Express{
  injectNecessaryMiddlewares();

  const openDirectoryItems = [rootDirectoryItem];
  let activeDirectoryItem = rootDirectoryItem;

  while(activeDirectoryItem) {
    if (activeDirectoryItem.cursor.index === 0) {

      const splittedFiles = fromFilesToSplitFiles(activeDirectoryItem.files);
      
      subscribeControllers(activeDirectoryItem, splittedFiles.CONTROLLER);
      
    }

    if (activeDirectoryItem.cursor.index >= activeDirectoryItem.subdirectorieNames.length) {
      openDirectoryItems.pop();
      activeDirectoryItem = openDirectoryItems[openDirectoryItems.length - 1];
      continue
    }
    
    openDirectoryItems.push(activeDirectoryItem.subdirectories[activeDirectoryItem.cursor.index++]);
    activeDirectoryItem = openDirectoryItems[openDirectoryItems.length - 1];
  }


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

function subscribeControllers(directoryItem: DirectoryItem, controllers: FileItem[]) {
  for (const controllerFile of controllers) {
    const path = controllerFile.directoryItem.routePath;
    const method = controllerFile.descriptor.method;

    const fn: ControllerFn = isFunction(controllerFile?.exported?.default) 
      ? controllerFile?.exported?.default as ControllerFn 
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

    log(`"${path}" added`, LogName.ROUTE);
    _express[expressFnName](path, wrapper);
  }
}