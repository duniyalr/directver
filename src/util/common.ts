import { logError } from "./log";

export function criticalErrorHandler(err: any) {
  if (err instanceof Error) {
    logError(err.message);
  }

  process.kill(process.pid);
}