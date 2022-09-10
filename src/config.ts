import { fromRelativePathToRoutePath } from "./util/dir";

export class Config {
  // the relative path of the files directory
  static MAIN_DIR_PATH: string = "api";
  static ROOT_DIR_NAME: string = "root";
  static ROOT_DIR_FULLNAME: string = "root";
}

export enum FileType {
  CONTROLLER = "CONTROLLER",
  PIPE = "PIPE",
  GUARD = "GUARD"
}

/**
 * a dynamic directory will transforms to a dynamic part in 
 * route path
 */
export enum DirectoryType {
  DYNAMIC = "DYNAMIC",
  STATIC = "STATIC"
}

export class Cursor {
  index: number = 0;
}

export type FileExportObject = {
  fn: Function;
}

export type FileExport = Function | FileExportObject | undefined;

export const FileMethod: {
  [key: string]: string
} = {
  POST :"POST",
  GET : "GET",
  PUT : "PUT",
  PATCH : "PATCH",
  DELETE : "DELETE"
}

export const FileScope: {
  [key: string]: string
} = {
  BODY: "BODY",
  QUERY: "QUERY",
  PARAM: "PARAM",
}

export class FilePatt {
  static CONTROLLER_TYPE = /^_$/;
  static PIPE_TYPE = /^@?pipe$/;
  static GUARD_TYPE = /^@?guard$/;
  static METHOD = new RegExp("^" + Object.values(FileMethod).map(method => `(${method.toLowerCase()})`).join("|") + "$");
  static SCOPE = new RegExp("^" + Object.values(FileScope).map(method => `(${method.toLowerCase()})`).join("|") + "$");
  static NAME = /^[^0-9][a-zA-z_0-9]*$/;
  static EXT = /(js)|(ts)/;
}

export type FileDescriptor = {
  type: FileType | null;
  method: string | null; // type fixing
  scope: string | null; // type fixing
  name: string | null;
  cover: boolean | null;
}

export class FileItem {
  readonly fullName: string;

  readonly directoryItem: DirectoryItem;
  readonly exported: FileExport;

  readonly descriptor: FileDescriptor;

  constructor(
    fullName: string,
    descriptor: FileDescriptor,
    directoryItem: DirectoryItem,
    exported: FileExport
  ) {
    this.fullName = fullName;
    this.descriptor = descriptor;
    this.directoryItem = directoryItem;
    this.exported = exported;
  }
}

export class DirectoryItem {
  readonly name: string;
  readonly type: DirectoryType;
  // directory real name in file system
  readonly fullName: string;
  readonly relativePath: string;
  readonly absPath: string;
  readonly routePath: string;

  readonly isRoot: boolean = false;

  rawDirectoryNames: string[] = [];
  fileNames: string[] = [];
  subdirectorieNames: string[] = [];

  cursor: Cursor;

  subdirectories: DirectoryItem[] = [];
  files: FileItem[] = [];

  constructor(
    name: string,
    type: DirectoryType,
    fullName: string,
    relativePath: string,
    absPath: string ,
    isRoot?: boolean
  ) {
    this.name = name;
    this.type = type;
    this.fullName = fullName;
    this.relativePath = relativePath;
    this.absPath = absPath;

    if (isRoot) this.isRoot = isRoot;

    this.routePath = fromRelativePathToRoutePath(this.relativePath);
    this.cursor = new Cursor();
  }
}