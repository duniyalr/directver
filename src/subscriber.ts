import express from "express";
import { DirectoryItem, FileItem } from "./config";
import { fromFilesToSplitFiles } from "./util/common";

const _express = express();

export type SplittedFiles = {
  CONTROLLER: FileItem[],
  PIPE: FileItem[],
  GUARD: FileItem[]
}

export function subscribe(rootDirectoryItem: DirectoryItem) {
  const openDirectoryItems = [rootDirectoryItem];
  const activeDirectoryItem = rootDirectoryItem;

  while(activeDirectoryItem) {
    const splittedFiles = fromFilesToSplitFiles(activeDirectoryItem.files);

    
    console.log(activeDirectoryItem)
    break;
  }
}

function subscribeControllers(directoryItem: DirectoryItem, controllers: FileItem[]) {

}