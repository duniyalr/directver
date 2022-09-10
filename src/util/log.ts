export enum LogType {
  LOG = "LOG",
  ERROR = "ERROR"
}

export function log(message: string) {
  console.log(`[${LogType.LOG}]       ${message}`);
}

export function logError(message: string) {
  console.log(`[${LogType.ERROR}]     ${message}`)
}