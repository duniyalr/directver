/**
 * Directver version 0.0.1
 */
import { Express } from "express";
import { Config, ConfigOption } from "./src/config";
import { traverseMainDirectory } from "./src/directory";
import { subscribe } from "./src/subscriber";
import { log } from "./src/util/log";

/**
 * bootstrapes the framework initialization
 */
export default async function (opts?: ConfigOption): Promise<Express> {
  if (opts && typeof opts === "object" && !Array.isArray(opts)) {
    Object.keys(opts).forEach((optKey) => {
      const v = opts[optKey];
      switch (optKey) {
        case "mainDir":
          optKey = "MAIN_DIR_PATH";
          break;
        case "port":
          optKey = optKey.toUpperCase();
          break;
      }

      Config[optKey] = v;
    });
  }
  log(`Bootstraping the Directver`);
  const rootDirectoryItem = await traverseMainDirectory();
  const _expressApp = subscribe(rootDirectoryItem);

  _expressApp.listen(Config.PORT, () => {
    log(`Directver is listening to port ${Config.PORT}`);
  });

  return _expressApp;
}
