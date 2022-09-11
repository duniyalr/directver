import chalk from "chalk";

const timestampStyle = chalk.blue;
const logNameStyle = chalk.yellow;
const logTypeStyle = chalk.hex("#f59842");
const errorStyle = chalk.red;
export enum LogType {
  LOG = "LOG",
  ERROR = "ERROR"
}

export enum LogName {
  CHECK = "CHECK",
  ROUTE = "ROUTE",
}

export function log(message: string, logName: LogName = LogName.CHECK) {
  console.log(
    logTypeStyle(`[${LogType.LOG}]`),
    timestampStyle(`  [${(new Date()).toLocaleTimeString()}]`),
    logNameStyle(`  [${logName}]  ${message}`)
    );
}

export function logError(message: string) {
  console.log(errorStyle(`[${LogType.ERROR}]     ${message}`))
}