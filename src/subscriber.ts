import express, { NextFunction, Request, Response } from "express";
import { Context, DirectoryItem, DirectverRequest, FileItem } from "./config";
import { criticalErrorHandler, fromFilesToSplitFiles, isFunction } from "./util/common";

const _express = express();

export type SplittedFiles = {
  CONTROLLER: FileItem[],
  PIPE: FileItem[],
  GUARD: FileItem[]
}

export function subscribe(rootDirectoryItem: DirectoryItem) {
  const openDirectoryItems = [rootDirectoryItem];
  const activeDirectoryItem = rootDirectoryItem;

  while(activeDirectoryItem) {
    const splittedFiles = fromFilesToSplitFiles(activeDirectoryItem.files);

    subscribeControllers(activeDirectoryItem, splittedFiles.CONTROLLER);
    
    break;
  }
}

function subscribeControllers(directoryItem: DirectoryItem, controllers: FileItem[]) {
  for (const controllerFile of controllers) {
    const path = controllerFile.directoryItem.routePath;
    const method = controllerFile.descriptor.method;

    const fn = isFunction(controllerFile?.exported?.default) && controllerFile?.exported?.default as Function;
    
    if (!fn) { criticalErrorHandler(new Error(`Controller in "${directoryItem.relativePath}" doesn't export a function`))}
    const expressFnName = method ? method.toLowerCase() : "all";

    const wrapper = async function(req: DirectverRequest, res: Response, next: NextFunction) {
      let response: any = await fn(req.__directver.context);
      if (response instanceof Promise) {
        response = await response;
      }

      // check empty resposne
      if (!response) response = {};

      return next(response);
    }

    _express[expressFnName](path, wrapper);
  }
}