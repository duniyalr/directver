/**
 * Directver version 0.0.1
 */

import { traverseMainDirectory } from "./src/directory";
import { subscribe } from "./src/subscriber";

/**
 * bootstrapes the framework initialization
 */
export async function bootstrap() {
  const rootDirectoryItem = await traverseMainDirectory();
  const _expressApp = subscribe(rootDirectoryItem);
}