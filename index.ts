/**
 * Directver version 0.0.1
 */

import { traverseMainDirectory } from "./src/directory";

/**
 * bootstrapes the framework initialization
 */
export function bootstrap() {
  const rootDirectoryItem = traverseMainDirectory();
}