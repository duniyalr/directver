export enum LogType {
  LOG = "LOG",
  ERROR = "ERROR"
}

export enum LogName {
  CHECK = "CHECK",
  ROUTE = "ROUTE",
}

export function log(message: string, logName: LogName = LogName.CHECK) {
  console.log(`[${LogType.LOG}]  [${(new Date()).toLocaleTimeString()}]  [${logName}]  ${message}`);
}

export function logError(message: string) {
  console.log(`[${LogType.ERROR}]     ${message}`)
}