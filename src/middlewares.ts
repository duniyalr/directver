import { NextFunction, Request, Response } from "express";
import {
  Context,
  DirectverRequest,
  DirectverResponse,
  HttpError,
  __Directver,
} from "./config";

export function inject__directver(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const _req = req as DirectverRequest;
  const context = new Context(req, res);
  _req.__directver = new __Directver(context);
  return next();
}

/**
 * general function for finishing the request-response cycle and sending a resposne
 * to client;
 */
export function responser(
  __unknownObject: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!(__unknownObject instanceof DirectverResponse))
    return next(__unknownObject);
  const directverResponse = __unknownObject;

  return res
    .status(directverResponse.statusCode)
    .contentType(directverResponse.contentType)
    .send(directverResponse.data);
}

export function basicErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!(err instanceof HttpError)) return next(err);
  return res.status(err.statusCode).contentType("application/json").send(err);
}

/**
 * this handler is last middleware in chain
 * if an error reaches this middleware it means that previous one
 * couldn't handle that
 */
export function finalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  return res
    .status(500)
    .contentType("application/json")
    .send(
      new HttpError(
        500,
        err instanceof Error ? err.message : "Something happened!"
      )
    );
}
