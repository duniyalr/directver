import { stat } from "node:fs/promises";
import path, { resolve, sep } from "node:path";
import { FileDescriptor, FileMethod, FilePatt, FileScope, FileType } from "../config";
import { criticalErrorHandler } from "./common";
import { logError } from "./log";

export async function seperateDirectoryFromFile(rawDirectoryNames: string[], absPath: string): Promise<{files: string[], directories: string[]}> {
  const directories = [];
  const files = [];
  for (const directoryName of rawDirectoryNames) {
    const _stat = await stat(resolve(absPath, directoryName));
    if (_stat.isDirectory()) {
      directories.push(directoryName);
      continue;
    } else if (_stat.isFile()) {
      files.push(directoryName);
    }
  }

  return {
    files,
    directories
  }
}

export function fromFullNameToDirectoryItemName(name: string): string {
  return name;
}

export function fromFullNameToFileItemName(name: string): string {
  return name;
}

function getFileType(type: string | undefined): FileType | null {  
  if (type === undefined) return null;
  return (
    FilePatt.CONTROLLER_TYPE.test(type) ?
    FileType.CONTROLLER :
    FilePatt.PIPE_TYPE.test(type) ?
    FileType.PIPE :
    FilePatt.GUARD_TYPE.test(type) ?
    FileType.GUARD :
    FilePatt.OUT_TYPE.test(type) ?
    FileType.OUT :
    null
  );
}

function getFileMethod(method: string | undefined): string | null {
  if (method === undefined) return null;
  return (
    FilePatt.METHOD.test(method) ?
    FileMethod[method.toUpperCase()] :
    null
  )
}

function getFileScope(scope: string | undefined): string | null {
  if (scope === undefined) return null;
  return (
    FilePatt.SCOPE.test(scope) ? 
    FileScope[scope.toUpperCase()] :
    null
  )
}

function getFileName(name: string | undefined | null): string | null {
  if (!name) return null;
  return (
    FilePatt.NAME.test(name) ?
    name :
    null
  );
}

function isCover(type: FileType | undefined | null): boolean {
  if (!type) return false;
  return /^@.*/.test(type as string);
}

export function fullNameToFileDescriptor(fullName: string): FileDescriptor {
  const fileDescriptor: FileDescriptor = {
      name: null,
      type: null,
      method: null,
      scope: null,
      cover: null
  }

  const parts = fullName.split(".");
  if (parts.length < 2) {
    criticalErrorHandler(new Error(`"${fullName}" is not a valid file name`));
  }

  const type = getFileType(parts.shift());
  if (type === null ) {
    criticalErrorHandler(new Error(`Type of ${fullName} is invalid`));
  }
  fileDescriptor.type = type;
  fileDescriptor.cover = isCover(type);

  let part = parts.shift();

  const method = getFileMethod(part);
  if (method) {
    part = parts.shift();
    fileDescriptor.method = method;
  }

  if (!part) return fileDescriptor;
  const scope = getFileScope(part);
  if (scope) {
    part = parts.shift();
    fileDescriptor.scope = scope;
  }

  if (!part) return fileDescriptor;
  const name = getFileName(part);
  if (name) {
    part = parts.shift();
    fileDescriptor.name = name;
  }

  return fileDescriptor;
}

export function isDynamicPathPart(part: string): boolean {
  return /^\[([^0-9][a-zA-Z0-9]*)\]$/.test(part);
}

export function dynamicPathPartToDynmaicPath(part: string) {
  const compiled = /^\[(?<name>[^0-9][a-zA-Z0-9]*)\]$/.exec(part);
  
  return ":" + compiled?.groups?.name;  
}

export function fromRelativePathToRoutePath(relativePath: string): string {
  return relativePath.split(sep)
    .map(part => {
      if (isDynamicPathPart(part)) {
        const pathPart = dynamicPathPartToDynmaicPath(part);
        if (pathPart) return pathPart;
        return "";
      }
      return part;
    }).join("/")
}