/**
 * Directver version 0.0.1
 */

import { Config } from "./src/config";
import { traverseMainDirectory } from "./src/directory";
import { subscribe } from "./src/subscriber";
import { criticalErrorHandler } from "./src/util/common";
import { log } from "./src/util/log";

/**
 * bootstrapes the framework initialization
 */
export async function bootstrap() {
  log(`Bootstraping the Directver`);
  const rootDirectoryItem = await traverseMainDirectory();
  const _expressApp = subscribe(rootDirectoryItem);

  _expressApp.listen(Config.PORT, () => {
    log(`Directver is listening to port ${Config.PORT}`)
  });
}