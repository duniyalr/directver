import { NextFunction, Request, Response } from "express";
import { fromRelativePathToRoutePath } from "./util/dir";
import { Express } from "express";
import { STATUS_CODES } from "node:http";

export const FileMethod: {
  [key: string]: string;
} = {
  POST: "POST",
  GET: "GET",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  ALL: "ALL",
};

export type ConfigOption = {
  mainDir?: string;
  port?: number;
};

export class Config {
  // the relative path of the files directory
  static MAIN_DIR_PATH: string = "api";
  static ROOT_DIR_NAME: string = "root";
  static ROOT_DIR_FULLNAME: string = "root";
  /**
   * if a file doesn't export a handler use default handler
   * and throw no error
   */
  static USE_DEFAULT_CONTROLLER_FN = true;

  /**
   * all method is used when not method provided
   */
  static DEFAULT_METHOD = FileMethod.ALL;
  static PORT = 2323;
}

export enum FileType {
  CONTROLLER = "CONTROLLER",
  PIPE = "PIPE",
  GUARD = "GUARD",
  OUT = "OUT",
}

/**
 * a dynamic directory will transforms to a dynamic part in
 * route path
 */
export enum DirectoryType {
  DYNAMIC = "DYNAMIC",
  STATIC = "STATIC",
}

export class Cursor {
  index: number = 0;
}

export type FileExportObject = {
  default: Function | Object;
};

export type FileExport = FileExportObject | undefined;

export const FileScope: {
  [key: string]: string;
} = {
  BODY: "BODY",
  QUERY: "QUERY",
  PARAM: "PARAM",
};

export class FilePatt {
  static CONTROLLER_TYPE = /^_$/;
  static PIPE_TYPE = /^@?pipe$/;
  static GUARD_TYPE = /^@?guard$/;
  static OUT_TYPE = /^@?out$/;
  static METHOD = new RegExp(
    "^" +
      Object.values(FileMethod)
        .map((method) => `(${method.toLowerCase()})`)
        .join("|") +
      "$"
  );
  static SCOPE = new RegExp(
    "^" +
      Object.values(FileScope)
        .map((method) => `(${method.toLowerCase()})`)
        .join("|") +
      "$"
  );
  static NAME = /^[^0-9][a-zA-z_0-9]*$/;
  static EXT = /(js)|(ts)/;
}

export type FileDescriptor = {
  type: FileType | null;
  method: string | null; // type fixing
  scope: string | null; // type fixing
  name: string | null;
  cover: boolean | null;
};

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
    absPath: string,
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

  resetCursor() {
    this.cursor = new Cursor();
  }
}

export class __Directver {
  context: Context;

  constructor(context: Context) {
    this.context = context;
  }
}

export class Context {
  body: Object;
  params: Object;
  query: Object;

  private request: Request;
  private response: Response;
  private meta: {
    [key: string]: any;
  } = {};

  constructor(request: Request, response: Response) {
    this.request = request;
    this.response = response;

    this.body = request.body;
    this.params = request.params;
    this.query = request.query;
  }

  setMeta = (key: string, value: any) => {
    this.meta[key] = value;
  };

  getMeta = (key: string) => {
    return this.meta[key];
  };

  getRequest = (): Request => {
    return this.request;
  };

  getResponse = (): Response => {
    return this.response;
  };
}

export type DirectverRequest = Request & {
  __directver: {
    context: Context;
  };
};

export class DirectverResponse {
  data: any;
  statusCode: number;
  contentType: string;
  constructor(data: any, req: DirectverRequest) {
    this.data = data;

    if (typeof data === "object") {
      this.contentType = "application/json";
    } else {
      this.contentType = "text/plain";
    }

    this.statusCode = req.statusCode ? req.statusCode : 200;
  }
}

export type GuardFn = (ctx: Context) => boolean;
export type PipeFn = (ctx: Context) => any;
export type ControllerFn = (ctx: Context) => any;
export type OutFn = (data: any) => any;

export function defaultControllerFn(ctx: Context) {
  return {};
}

export class LazyInject {
  expressFnName: string;
  path: string | RegExp;
  originalPath: string;
  type: FileType;
  method: string;
  fn: any; // TODO func declaration (__unknown: any, req: Request, res: Response, next: NextFunction) => void

  constructor(
    expressFnName: string,
    path: string | RegExp,
    originalPath: string,
    type: FileType,
    method: string,
    fn: any
  ) {
    this.expressFnName = expressFnName;
    this.path = path;
    this.originalPath = originalPath;
    this.type = type;
    this.method = method;
    this.fn = fn;
  }
}

export class HttpError {
  statusCode: number;
  message: string;
  error: string;
  constructor(statusCode: number, message: string) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = STATUS_CODES[this.statusCode]
      ? STATUS_CODES[this.statusCode]
      : "Unknown Error";
  }
}
