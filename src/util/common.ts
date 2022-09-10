import { FileItem, FileType } from "../config";
import { logError } from "./log";
import { SplittedFiles } from "../subscriber";
import { validate } from "class-validator";

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
    GUARD: []
  } 

  for(const file of files) {
    const descriptor = file.descriptor;
    switch(file.descriptor.type) {
      case FileType.CONTROLLER: {
        console.log(descriptor)
        // this condition has a conflict with fullNameToFileDescriptor TODO
        //if (descriptor.name) criticalErrorHandler(new Error(`Controller can't have a name in ${file.directoryItem.relativePath}`))
        if (descriptor.scope) criticalErrorHandler(new Error(`Controller can't have a scope in ${file.directoryItem.relativePath}`))

        splittefFiles.CONTROLLER.push(file);
        break;
      }

      case FileType.PIPE: {
        if (descriptor.scope) criticalErrorHandler(new Error(`Pipe can't have a scope in ${file.directoryItem.relativePath}`))

        splittefFiles.PIPE.push(file);
        break;
      }

      case FileType.GUARD: {
        if (descriptor.scope) criticalErrorHandler(new Error(`Guard can't have a scope in ${file.directoryItem.relativePath}`))

        splittefFiles.GUARD.push(file);
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