/**
 * directory.ts handles finding, reading files in main directory and producing the 
 * necessary objects for next phase
 */

import { Config, DirectoryItem, DirectoryType, FileItem } from "./config";
import { log } from "./util/log";
import { readdir } from "node:fs/promises";
import { join, normalize, resolve } from "node:path";
import { criticalErrorHandler } from "./util/common";
import { fromFullNameToDirectoryItemName, fullNameToFileDescriptor, seperateDirectoryFromFile } from "./util/dir";
import { pathToFileURL } from "node:url";

export async function traverseMainDirectory(): Promise<DirectoryItem> {
  log(`Traversing the "${Config.MAIN_DIR_PATH}" directory`)
  const mainDir = Config.MAIN_DIR_PATH;
  const openDirectoryItems: DirectoryItem[] = [];
  let activeDirectoryItem: DirectoryItem;

  const rootAbsPath = resolve(process.cwd(), mainDir);

  const rootDirectoryItem = new DirectoryItem(
    Config.ROOT_DIR_NAME,
    DirectoryType.STATIC,
    Config.ROOT_DIR_FULLNAME,
    "/",
    rootAbsPath,
    true
  );

  openDirectoryItems.push(rootDirectoryItem);
  activeDirectoryItem = rootDirectoryItem;

  while(activeDirectoryItem) {
    const cursor = activeDirectoryItem.cursor;
    if (cursor.index === 0) {
      const absPath = activeDirectoryItem.absPath;
      try {
        activeDirectoryItem.rawDirectoryNames = await readdir(activeDirectoryItem.absPath) as string[];
      } catch(err) { criticalErrorHandler(err) }

      const {files: fileNames, directories: subdirectoryNames} = await seperateDirectoryFromFile(activeDirectoryItem.rawDirectoryNames, activeDirectoryItem.absPath);
      activeDirectoryItem.fileNames = fileNames;
      activeDirectoryItem.subdirectorieNames = subdirectoryNames;

      // initializing directoryItems for directories
      for (const subdirectoryName of subdirectoryNames) {
        const name = fromFullNameToDirectoryItemName(subdirectoryName);
        const subdirectoryDirectoryItem = new DirectoryItem(
          name,
          (name !== subdirectoryName ? DirectoryType.DYNAMIC : DirectoryType.STATIC),
          subdirectoryName,
          join(activeDirectoryItem.relativePath, subdirectoryName),
          resolve(activeDirectoryItem.absPath, subdirectoryName)
        );

        activeDirectoryItem.subdirectories.push(subdirectoryDirectoryItem);
      }

      for (const fileName of activeDirectoryItem.fileNames) {
        
        const exported = await import(pathToFileURL(resolve(absPath, fileName)).toString());
        const fileDescriptor = fullNameToFileDescriptor(fileName);
        const file = new FileItem(
          fileName,
          fileDescriptor,
          activeDirectoryItem,
          exported
        )

        activeDirectoryItem.files.push(file);
      }
      
    }

    if (activeDirectoryItem.cursor.index >= activeDirectoryItem.subdirectories.length) {
      // reseting cursor for next tree traversing;
      activeDirectoryItem.resetCursor();
      openDirectoryItems.pop();
      activeDirectoryItem = openDirectoryItems[openDirectoryItems.length - 1];
      continue;
    }

    openDirectoryItems.push(activeDirectoryItem.subdirectories[activeDirectoryItem.cursor.index++]);
    activeDirectoryItem = openDirectoryItems[openDirectoryItems.length - 1];

  }

  return rootDirectoryItem;
}