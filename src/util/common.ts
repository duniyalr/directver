import { Config, FileItem, FileMethod, FileType } from "../config";
import { logError } from "./log";
import { SplittedFiles } from "../subscriber";
import { validate } from "class-validator";
import { NextFunction } from "express";

export function criticalErrorHandler(err: any) {
  if (err instanceof Error) {
    logError(err.message);
  }

  process.kill(process.pid);
}

export function fromFilesToSplitFiles(files: FileItem[]): SplittedFiles {
  const splittefFiles: SplittedFiles = {
    CONTROLLER: [],
    PIPE: [],
    GUARD: [],
    OUT: []
  } 

  
  for(const file of files) {
    const descriptor = file.descriptor;
    switch(file.descriptor.type) {
      case FileType.CONTROLLER: {
        // this condition has a conflict with fullNameToFileDescriptor TODO
        //if (descriptor.name) criticalErrorHandler(new Error(`Controller can't have a name in ${file.directoryItem.relativePath}`))
        if (descriptor.scope) criticalErrorHandler(new Error(`Controller can't have a scope in ${file.directoryItem.relativePath}`))
        /**
         * if method not provided the default method will use
         */
        if (!descriptor.method) descriptor.method = Config.DEFAULT_METHOD;
        splittefFiles.CONTROLLER.push(file);
        break;
      }

      case FileType.PIPE: {
        if (descriptor.scope) criticalErrorHandler(new Error(`Pipe can't have a scope in ${file.directoryItem.relativePath}`))

        if (!descriptor.method) descriptor.method = Config.DEFAULT_METHOD;
        splittefFiles.PIPE.push(file);
        break;
      }

      case FileType.GUARD: {
        if (descriptor.scope) criticalErrorHandler(new Error(`Guard can't have a scope in ${file.directoryItem.relativePath}`))

        if (!descriptor.method) descriptor.method = Config.DEFAULT_METHOD;
        splittefFiles.GUARD.push(file);
        break;
      }

      case FileType.OUT: {

        if (!descriptor.method) descriptor.method = Config.DEFAULT_METHOD;
        splittefFiles.OUT.push(file);
        break;
      }
    }
  }

  return splittefFiles;
}

export function isFunction(fn: any): boolean {
  return (
    fn &&
    (
      {}.toString.call(fn) === "[object Function]" ||
      {}.toString.call(fn) === "[object AsyncFunction]"
    )
  )
}

export function methodizeUse(fn: Function, methods: string | string[], errorHandler: boolean = false):
  ((__unknown: any, req: Request, res: Response, next: NextFunction) => any) |
  ((req: Request, res: Response, next: NextFunction) => any) | 
  typeof fn
{
  if (!Array.isArray(methods)) methods = [methods];
  methods = methods.map(method => method.toLowerCase());

  if (methods.includes("all")) return fn;

  return errorHandler ? 
  function(__unknown: any, req: Request, res: Response, next: NextFunction) {
    if (!methods.includes(req.method)) return next();
    return fn()
  }
  : function(req: Request, res: Response, next: NextFunction) {
    if (!methods.includes(req.method)) return next();
    return fn()
  }
}