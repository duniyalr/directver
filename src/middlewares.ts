import { NextFunction, Request, Response } from "express";
import { Context, DirectverRequest, DirectverResponse } from "./config";

export function injectContext(req: DirectverRequest, res: Response, next: NextFunction) {
  const context = new Context(req, res);

  req.__directver.context = context;
  return next();
}

/**
 * general function for finishing the request-response cycle and sends a resposne 
 * to client;
 */
export function responser(__unknownObject: any, req: DirectverRequest, res: Response, next: NextFunction) {
  const directverResponse = __unknownObject;
  return res
    .status(directverResponse.statusCode)
    .contentType(directverResponse.contentType)
    .send(directverResponse.data);
}