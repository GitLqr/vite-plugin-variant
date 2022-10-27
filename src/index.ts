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
    if (fileUtil.isExist(dstDirPath)) {
      // subfile or subdir update(create or update or delete) under the mcs dir.
      // ignore this event because other listener will handle it when necessary.
      log("【onDirUpdate】ignore update ", filePath);
    } else {
      // it's impossible the remove event, it's only possible add or update event,
      // so create new fcs dir whether it is mcs main dir or channel dir.
      fileUtil.mkdirs(dstDirPath);
      log("【onDirUpdate】create the fcs dir : ", dstDirPath);
    }
  }
}

function onFileUpdate(filePath: string) {
  const dstFilePath = getFcsFilePath(filePath);
  if (dstFilePath) {
    if (isMcsChannelFilePath(filePath)) {
      // if the mcs channel file add or update, copy directly, because the mcs channel file has priority over the mcs main file.
      fileUtil.copyFile(filePath, dstFilePath);
      log("【onFileUpdate】update the fcs file : ", dstFilePath);
    } else if (isMcsMainFilePath(filePath)) {
      // if the mcs main file add or update.
      const mcsChannelFile = getMcsChannelFilePath(filePath);
      if (mcsChannelFile && fileUtil.isExist(mcsChannelFile)) {
        // if the mcs channel file exist, ignore the mcs main file's update event, because the mcs channel file has priority over the mcs main file.
        log("【onFileUpdate】ignore update ", filePath);
      } else {
        // if the mcs channel file does not exist, copy the mcs main file to the fcs file.
        fileUtil.copyFile(filePath, dstFilePath);
        log("【onFileUpdate】update the fcs file : ", dstFilePath);
      }
    }
  }
}

function onDirRemove(filePath: string) {
  const dstDirPath = getFcsFilePath(filePath);
  if (dstDirPath && fileUtil.isExist(dstDirPath)) {
    if (isMcsChannelFilePath(filePath)) {
      // if the mcs channel file remove.
      const mcsMainDir = getMcsMainFilePath(filePath);
      if (mcsMainDir && fileUtil.isExist(mcsMainDir)) {
        // if the mcs main dir exist, the mcs main dir has the first priority, so copy the mcs main dir to the fcs dir and clear the fcs dir at the same time.
        fileUtil.copyDir(mcsMainDir, dstDirPath, true);
        log("【onDirRemove】copy the mcs main dir to the fcs dir.");
      } else {
        // if the mcs main dir does not exist, remove the fcs dir directly.
        fileUtil.rm(dstDirPath);
        log("【onDirRemove】remove the fcs dir : ", dstDirPath);
      }
    } else if (isMcsMainFilePath(filePath)) {
      // if the mcs main dir remove.
      const mcsChannelDir = getMcsChannelFilePath(filePath);
      if (mcsChannelDir && fileUtil.isExist(mcsChannelDir)) {
        // if the mcs channel dir exist, ignore the mcs main dir's remove event, because the mcs channel dir has priority over the mcs main dir.
        log("【onDirRemove】ignore remove ", filePath);
      } else {
        // if the mcs channel dir does not exist, remove the fcs dir directly.
        fileUtil.rm(dstDirPath);
        log("【onDirRemove】remove the fcs dir : ", dstDirPath);
      }
    }
  }
}

function onFileRemove(filePath: string) {
  const dstFilePath = getFcsFilePath(filePath);
  if (dstFilePath && fileUtil.isExist(dstFilePath)) {
    if (isMcsChannelFilePath(filePath)) {
      // if the mcs channel file remove.
      const mcsMainFile = getMcsMainFilePath(filePath);
      if (mcsMainFile && fileUtil.isExist(mcsMainFile)) {
        // if the mcs main file exist, the mcs main file has the first priority, so copy the mcs main file to the fcs file.
        fileUtil.copyFile(mcsMainFile, dstFilePath);
      } else {
        // if the mcs main file does not exist, remove the fcs file directly.
        fileUtil.rm(dstFilePath);
        log("【onFileRemove】remove the fcs file : ", dstFilePath);
      }
    } else if (isMcsMainFilePath(filePath)) {
      // if the mcs main file remove.
      const mcsChannelFile = getMcsChannelFilePath(filePath);
      if (mcsChannelFile && fileUtil.isExist(mcsChannelFile)) {
        // if the mcs channel file exist, ignore the mcs main file's remove event, because the mcs channel file has priority over the mcs main file.
        log("【onFileRemove】ignore remove ", filePath);
      } else {
        // if the mcs channel file doet not exist, remove the fcs file directly.
        fileUtil.rm(dstFilePath);
        log("【onFileRemove】remove the fcs file : ", dstFilePath);
      }
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
  if (isMcsMainFilePath(srcPath)) {
    const mcsMainDirPath = getMcsMainDirPath();
    const index = srcPath.indexOf(mcsMainDirPath);
    return srcPath.substring(index + mcsMainDirPath.length);
  }

  if (isMcsChannelFilePath(srcPath)) {
    const mcsChannelDirPath = getMcsCurrentChannelDirPath()!!;
    const index = srcPath.indexOf(mcsChannelDirPath);
    return srcPath.substring(index + mcsChannelDirPath.length);
  }
}

/**
 * get the mcs main file path by refer to the mcs channel file path.
 */
function getMcsMainFilePath(mcsChannelFilePath: string) {
  const relativePath = getRelativePath(mcsChannelFilePath);
  if (relativePath) {
    const mcsMainDirPath = getMcsMainDirPath();
    return fileUtil.getPath(false, mcsMainDirPath, relativePath);
  }
}

/**
 * get the mcs channel file path by refer to the mcs main file path.
 */
function getMcsChannelFilePath(mcsMainFilePath: string) {
  const relativePath = getRelativePath(mcsMainFilePath);
  if (relativePath) {
    const mcsChannelDirPath = getMcsCurrentChannelDirPath();
    if (mcsChannelDirPath) {
      return fileUtil.getPath(false, mcsChannelDirPath, relativePath);
    }
  }
}

/**
 * get the fcs dir path by refer to the mcs dir path.
 */
function getFcsFilePath(mcsFilePath: string) {
  const relativePath = getRelativePath(mcsFilePath);
  if (relativePath) {
    const fcsDirPath = getFcsDirPath();
    return fileUtil.getPath(false, fcsDirPath, relativePath);
  }
}

function isMcsMainFilePath(srcPath: string) {
  const mcsMainDirPath = getMcsMainDirPath();
  return srcPath.indexOf(mcsMainDirPath) !== -1;
}

function isMcsChannelFilePath(srcPath: string) {
  const mcsChannelDirPath = getMcsCurrentChannelDirPath();
  return mcsChannelDirPath && srcPath.indexOf(mcsChannelDirPath) !== -1;
}

function log(message?: any, ...optionalParams: any[]) {
  if (variantOption?.debug) {
    console.log(message, ...optionalParams);
  }
}
