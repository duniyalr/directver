import { NextFunction, Request, Response } from "express";
import { Context, DirectverRequest, DirectverResponse, __Directver } from "./config";

export function inject__directver(req: Request, res: Response, next: NextFunction) {
  const _req = req as DirectverRequest;
  const context = new Context(req, res);
  _req.__directver = new __Directver(context);
  return next();

}

/**
 * general function for finishing the request-response cycle and sends a resposne 
 * to client;
 */
export function responser(__unknownObject: any, req: Request, res: Response, next: NextFunction) {
  const directverResponse = __unknownObject;

  return res
    .status(directverResponse.statusCode)
    .contentType(directverResponse.contentType)
    .send(directverResponse.data);
}

export function finalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.log("dani", "");
}