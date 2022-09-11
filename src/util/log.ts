import chalk from "chalk";

const timestampStyle = chalk.blue;
const logNameStyle = chalk.yellowBright;
const logTypeStyle = chalk.hex("#f59842");
const errorStyle = chalk.red;
export enum LogType {
  LOG = "LOG",
  ERROR = "ERROR"
}

export enum LogName {
  CHECK = "CHECK",
  ROUTE = "ROUTE",
  PIPE = "PIPE",
  OUT = "OUT",
}

export function log(message: string, logName: LogName = LogName.CHECK) {
  console.log(
    logTypeStyle(`[${LogType.LOG}]`),
    timestampStyle(`  [${(new Date()).toLocaleTimeString()}]`),
    logNameStyle(`${`  [${logName}]`.padEnd(9)}  ${message}`)
    );
}

export function logError(message: string) {
  console.log(errorStyle(`[${LogType.ERROR}]     ${message}`))
}