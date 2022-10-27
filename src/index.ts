import watch from "node-watch";
import type { PluginOption } from "vite";
import * as fileUtil from "./utils/fileUtil";

export interface VariantOption {
  /**
   * MCS sources base path, default "./variants"
   */
  mcsBase?: string;
  /**
   * MCS sources main name, default "main"
   */
  mcsMain?: string;
  /**
   * MCS sources current channel name, default undefined
   */
  mcsCurrent?: string;
  /**
   * FCS sources base path, default "./"
   */
  fcsBase?: string;
  /**
   * FCS sources dir name, default "src"
   */
  fcsDir?: string;
  /**
   * whether to print log
   */
  debug?: boolean;
}

/**
 *
 * MCS: multiple channel src
 * FCS: final channel src
 *
 * @author LQR
 * @since 2022-10-23
 */
export default function vitePluginVariant(
  option?: VariantOption
): PluginOption {
  initVariantOption(option);
  return {
    name: "vite-plugin-variant",
    enforce: "pre",
    config() {
      console.log(`hook config()`);
    },
    buildStart(options) {
      console.log(`hook buildStart()`);
      syncMcsToFcs();
      startMcsWatcher();
    },
    buildEnd(err?) {
      console.log(`hook buildEnd()`);
      stopMcsWatcher();
    },
  };
}

/**
 * Default Variant Option
 */
const variantOption: VariantOption = {
  mcsBase: "./variants",
  mcsMain: "main",
  mcsCurrent: undefined,
  fcsBase: "./",
  fcsDir: "src",
  debug: false,
};

let mcsWatcher;

function initVariantOption(option?: VariantOption) {
  if (option) {
    if (option.mcsBase) variantOption.mcsBase = option.mcsBase;
    if (option.mcsMain) variantOption.mcsMain = option.mcsMain;
    if (option.mcsCurrent) variantOption.mcsCurrent = option.mcsCurrent;
    if (option.fcsBase) variantOption.fcsBase = option.fcsBase;
    if (option.fcsDir) variantOption.fcsDir = option.fcsDir;
    variantOption.debug = option.debug === true;
  }
}

/**
 * clear Fcs dir and copy Mcs files to Fcs dir
 */
function syncMcsToFcs() {
  // copy mcs main dir to fcs dir (NB: will clear original dir)
  const mcsMainDir = getMcsMainDirPath();
  const fcsDir = getFcsDirPath();
  fileUtil.copyDir(mcsMainDir, fcsDir, true);
  // copy mcs current channel dir to fcs dir (NB: only add or overwrite file)
  if (variantOption.mcsCurrent) {
    const mcsCurrentChannelDir = getMcsCurrentChannelDirPath();
    if (mcsCurrentChannelDir) {
      fileUtil.copyDir(mcsCurrentChannelDir, fcsDir, false);
    }
  }
}

/**
 * start Mcs files watcher service
 */
function startMcsWatcher() {
  const mcsRootPath = getMcsRootDirPath();
  mcsWatcher = watch(
    mcsRootPath,
    { recursive: true },
    function (eventType, filePath) {
      switch (eventType) {
        case "update":
          if (fileUtil.isDir(filePath)) {
            onDirUpdate(filePath);
          } else {
            onFileUpdate(filePath);
          }
          break;
        case "remove":
          // NB: this file or dir was removed, so can't know it's type
          onDirOrFileRemove(filePath);
          break;
        default:
          log(`watch file unknow operate : ${eventType} ${filePath}`);
          break;
      }
    }
  );
}

function onDirUpdate(filePath: string) {
  const dstDirPath = getFcsFilePath(filePath);
  if (dstDirPath) {
    // log(`【onDirUpdate】fcsDirPath : ${fcsDirPath}, dstDirPath : ${dstDirPath}`);
    if (fileUtil.isExist(dstDirPath)) {
      // subfile or subdir update(create or update or delete) under the dir
      log("【onDirUpdate】ignore update ", filePath);
    } else {
      // create new dir
      fileUtil.getPath(true, dstDirPath);
      log("【onDirUpdate】create dst dir : ", dstDirPath);
    }
  }
}

function onFileUpdate(filePath: string) {
  const dstFilePath = getFcsFilePath(filePath);
  if (dstFilePath) {
    if (fileUtil.isExist(dstFilePath)) {
      // update
      fileUtil.copyFile(filePath, dstFilePath);
      log("【onFileUpdate】update dst file : ", dstFilePath);
    } else {
      // add
      fileUtil.copyFile(filePath, dstFilePath);
      log("【onFileUpdate】create dst file : ", dstFilePath);
    }
  }
}

function onDirRemove(filePath: string) {
  const dstDirPath = getFcsFilePath(filePath);
  if (dstDirPath) {
    if (fileUtil.isExist(dstDirPath)) {
      fileUtil.rm(dstDirPath);
      log("【onDirRemove】remove dst dir : ", dstDirPath);
    }
  }
}

function onFileRemove(filePath: string) {
  const dstFilePath = getFcsFilePath(filePath);
  if (dstFilePath) {
    if (fileUtil.isExist(dstFilePath)) {
      fileUtil.rm(dstFilePath);
      log("【onDirRemove】remove dst file : ", dstFilePath);
    }
  }
}

function onDirOrFileRemove(filePath: string) {
  // find out the file or dir in Fcs
  let fcsFilePath: string | undefined;
  const isFileInMcsMain = filePath.startsWith(getMcsMainDirPath());
  if (isFileInMcsMain) {
    fcsFilePath = filePath.replace(getMcsMainDirPath(), getFcsDirPath());
  } else {
    const currentChannelDirPath = getMcsCurrentChannelDirPath();
    if (currentChannelDirPath) {
      fcsFilePath = filePath.replace(currentChannelDirPath, getFcsDirPath());
    }
  }

  // determine whether it is a directory or a file
  if (fcsFilePath) {
    if (fileUtil.isDir(fcsFilePath)) {
      // Mcs dir was removed
      onDirRemove(filePath);
    } else if (fileUtil.isFile(fcsFilePath)) {
      // Mcs file was removed
      onFileRemove(filePath);
    }
  }
}

/**
 * stop Mcs files watcher service
 */
function stopMcsWatcher() {
  mcsWatcher?.close();
}

/**
 * get Mcs root dir path, eg: ./variants
 */
function getMcsRootDirPath(): string {
  return fileUtil.getPath(true, variantOption.mcsBase!!);
}

/**
 * get Mcs main dir path, eg: ./variants/main
 */
function getMcsMainDirPath(): string {
  return fileUtil.getPath(
    true,
    variantOption.mcsBase!!,
    variantOption.mcsMain!!
  );
}

/**
 * get Mcs current channel dir path, eg:
 * - ./variants/main/googleplay
 * - ./variants/main/xiaomi
 */
function getMcsCurrentChannelDirPath(): string | undefined {
  if (variantOption.mcsCurrent) {
    return fileUtil.getPath(
      true,
      variantOption.mcsBase!!,
      variantOption.mcsCurrent
    );
  }
}

/**
 * get Fcs dir path, eg: ./src
 */
function getFcsDirPath(): string {
  return fileUtil.getPath(
    true,
    variantOption.fcsBase!!,
    variantOption.fcsDir!!
  );
}

/**
 * it is only possible to get the relative path of a Mcs dir or file
 */
function getRelativePath(srcPath: string): string | undefined {
  const mcsMainDirPath = getMcsMainDirPath();
  let index = srcPath.indexOf(mcsMainDirPath);
  if (index != -1) {
    return srcPath.substring(index + mcsMainDirPath.length);
  }

  const mcsCurrentChannelDirPath = getMcsCurrentChannelDirPath();
  if (
    mcsCurrentChannelDirPath &&
    (index = srcPath.indexOf(mcsCurrentChannelDirPath)) != -1
  ) {
    return srcPath.substring(index + mcsCurrentChannelDirPath.length);
  }
}

function getFcsFilePath(mcsFilePath: string) {
  const relativePath = getRelativePath(mcsFilePath);
  if (relativePath) {
    const fcsDirPath = getFcsDirPath();
    return fileUtil.getPath(false, fcsDirPath, relativePath);
  }
}

function log(message?: any, ...optionalParams: any[]) {
  if (variantOption?.debug) {
    console.log(message, ...optionalParams);
  }
}
