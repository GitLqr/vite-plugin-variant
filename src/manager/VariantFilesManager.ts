import { VariantOption } from "../models/VariantOption";
import * as fileUtil from "../utils/fileUtil";
import watch from "node-watch";

/**
 * 变体（渠道）文件管理器
 *
 * @author GitLqr
 * @since 2022-10-28
 */
export default class VariantFilesManager {
  private mcsWatcher;

  /**
   * Default Variant Option
   */
  private variantOption: VariantOption = {
    mcsBase: "./variants",
    mcsMain: "main",
    mcsCurrent: undefined,
    fcsBase: "./",
    fcsDir: "src",
    debug: false,
  };

  constructor(option?: VariantOption) {
    this.initVariantOption(option);
  }

  private initVariantOption(option?: VariantOption) {
    if (option) {
      if (option.mcsBase) this.variantOption.mcsBase = option.mcsBase;
      if (option.mcsMain) this.variantOption.mcsMain = option.mcsMain;
      if (option.mcsCurrent) this.variantOption.mcsCurrent = option.mcsCurrent;
      if (option.fcsBase) this.variantOption.fcsBase = option.fcsBase;
      if (option.fcsDir) this.variantOption.fcsDir = option.fcsDir;
      this.variantOption.debug = option.debug === true;
    }
  }

  /**
   * clear Fcs dir and copy Mcs files to Fcs dir
   */
  public syncMcsToFcs() {
    // copy mcs main dir to fcs dir (NB: will clear original dir)
    const mcsMainDir = this.getMcsMainDirPath();
    const fcsDir = this.getFcsDirPath();
    fileUtil.copyDir(mcsMainDir, fcsDir, true);
    // copy mcs current channel dir to fcs dir (NB: only add or overwrite file)
    if (this.variantOption.mcsCurrent) {
      const mcsCurrentChannelDir = this.getMcsCurrentChannelDirPath();
      if (mcsCurrentChannelDir) {
        fileUtil.copyDir(mcsCurrentChannelDir, fcsDir, false);
      }
    }
  }

  /**
   * start Mcs files watcher service
   */
  public startMcsWatcher() {
    const mcsRootPath = this.getMcsRootDirPath();
    this.mcsWatcher = watch(
      mcsRootPath,
      { recursive: true },
      (eventType, filePath) => {
        switch (eventType) {
          case "update":
            if (fileUtil.isDir(filePath)) {
              this.onDirUpdate(filePath);
            } else {
              this.onFileUpdate(filePath);
            }
            break;
          case "remove":
            // NB: this file or dir was removed, so can't know it's type
            this.onDirOrFileRemove(filePath);
            break;
          default:
            this.log(`watch file unknow operate : ${eventType} ${filePath}`);
            break;
        }
      }
    );
  }

  private onDirUpdate(filePath: string) {
    const dstDirPath = this.getFcsFilePath(filePath);
    if (dstDirPath) {
      if (fileUtil.isExist(dstDirPath)) {
        // subfile or subdir update(create or update or delete) under the mcs dir.
        // ignore this event because other listener will handle it when necessary.
        this.log("【onDirUpdate】ignore update ", filePath);
      } else {
        // it's impossible the remove event, it's only possible add or update event,
        // so create new fcs dir whether it is mcs main dir or channel dir.
        fileUtil.mkdirs(dstDirPath);
        this.log("【onDirUpdate】create the fcs dir : ", dstDirPath);
      }
    }
  }

  private onFileUpdate(filePath: string) {
    const dstFilePath = this.getFcsFilePath(filePath);
    if (dstFilePath) {
      if (this.isMcsChannelFilePath(filePath)) {
        // if the mcs channel file add or update, copy directly, because the mcs channel file has priority over the mcs main file.
        fileUtil.copyFile(filePath, dstFilePath);
        this.log("【onFileUpdate】update the fcs file : ", dstFilePath);
      } else if (this.isMcsMainFilePath(filePath)) {
        // if the mcs main file add or update.
        const mcsChannelFile = this.getMcsChannelFilePath(filePath);
        if (mcsChannelFile && fileUtil.isExist(mcsChannelFile)) {
          // if the mcs channel file exist, ignore the mcs main file's update event, because the mcs channel file has priority over the mcs main file.
          this.log("【onFileUpdate】ignore update ", filePath);
        } else {
          // if the mcs channel file does not exist, copy the mcs main file to the fcs file.
          fileUtil.copyFile(filePath, dstFilePath);
          this.log("【onFileUpdate】update the fcs file : ", dstFilePath);
        }
      }
    }
  }

  private onDirRemove(filePath: string) {
    const dstDirPath = this.getFcsFilePath(filePath);
    if (dstDirPath && fileUtil.isExist(dstDirPath)) {
      if (this.isMcsChannelFilePath(filePath)) {
        // if the mcs channel file remove.
        const mcsMainDir = this.getMcsMainFilePath(filePath);
        if (mcsMainDir && fileUtil.isExist(mcsMainDir)) {
          // if the mcs main dir exist, the mcs main dir has the first priority, so copy the mcs main dir to the fcs dir and clear the fcs dir at the same time.
          fileUtil.copyDir(mcsMainDir, dstDirPath, true);
          this.log("【onDirRemove】copy the mcs main dir to the fcs dir.");
        } else {
          // if the mcs main dir does not exist, remove the fcs dir directly.
          fileUtil.rm(dstDirPath);
          this.log("【onDirRemove】remove the fcs dir : ", dstDirPath);
        }
      } else if (this.isMcsMainFilePath(filePath)) {
        // if the mcs main dir remove.
        const mcsChannelDir = this.getMcsChannelFilePath(filePath);
        if (mcsChannelDir && fileUtil.isExist(mcsChannelDir)) {
          // if the mcs channel dir exist, the mcs channel dir has the first priority, so copy the mcs channel dir to the fcs dir and clear the fcs dir at the same time.
          fileUtil.copyDir(mcsChannelDir, dstDirPath, true);
          this.log("【onDirRemove】copy the mcs channel dir to the fcs dir.");
        } else {
          // if the mcs channel dir does not exist, remove the fcs dir directly.
          fileUtil.rm(dstDirPath);
          this.log("【onDirRemove】remove the fcs dir : ", dstDirPath);
        }
      }
    }
  }

  private onFileRemove(filePath: string) {
    const dstFilePath = this.getFcsFilePath(filePath);
    if (dstFilePath && fileUtil.isExist(dstFilePath)) {
      if (this.isMcsChannelFilePath(filePath)) {
        // if the mcs channel file remove.
        const mcsMainFile = this.getMcsMainFilePath(filePath);
        if (mcsMainFile && fileUtil.isExist(mcsMainFile)) {
          // if the mcs main file exist, the mcs main file has the first priority, so copy the mcs main file to the fcs file.
          fileUtil.copyFile(mcsMainFile, dstFilePath);
        } else {
          // if the mcs main file does not exist, remove the fcs file directly.
          fileUtil.rm(dstFilePath);
          this.log("【onFileRemove】remove the fcs file : ", dstFilePath);
        }
      } else if (this.isMcsMainFilePath(filePath)) {
        // if the mcs main file remove.
        const mcsChannelFile = this.getMcsChannelFilePath(filePath);
        if (mcsChannelFile && fileUtil.isExist(mcsChannelFile)) {
          // if the mcs channel file exist, ignore the mcs main file's remove event, because the mcs channel file has priority over the mcs main file.
          this.log("【onFileRemove】ignore remove ", filePath);
        } else {
          // if the mcs channel file doet not exist, remove the fcs file directly.
          fileUtil.rm(dstFilePath);
          this.log("【onFileRemove】remove the fcs file : ", dstFilePath);
        }
      }
    }
  }

  private onDirOrFileRemove(filePath: string) {
    // find out the file or dir in Fcs
    let fcsFilePath: string | undefined;
    const isFileInMcsMain = filePath.startsWith(this.getMcsMainDirPath());
    if (isFileInMcsMain) {
      fcsFilePath = filePath.replace(
        this.getMcsMainDirPath(),
        this.getFcsDirPath()
      );
    } else {
      const currentChannelDirPath = this.getMcsCurrentChannelDirPath();
      if (currentChannelDirPath) {
        fcsFilePath = filePath.replace(
          currentChannelDirPath,
          this.getFcsDirPath()
        );
      }
    }

    // determine whether it is a directory or a file
    if (fcsFilePath) {
      if (fileUtil.isDir(fcsFilePath)) {
        // Mcs dir was removed
        this.onDirRemove(filePath);
      } else if (fileUtil.isFile(fcsFilePath)) {
        // Mcs file was removed
        this.onFileRemove(filePath);
      }
    }
  }

  /**
   * stop Mcs files watcher service
   */
  public stopMcsWatcher() {
    this.mcsWatcher?.close();
  }

  /**
   * get Mcs root dir path, eg: ./variants
   */
  private getMcsRootDirPath(): string {
    return fileUtil.getPath(true, this.variantOption.mcsBase!!);
  }

  /**
   * get Mcs main dir path, eg: ./variants/main
   */
  private getMcsMainDirPath(): string {
    return fileUtil.getPath(
      true,
      this.variantOption.mcsBase!!,
      this.variantOption.mcsMain!!
    );
  }

  /**
   * get Mcs current channel dir path, eg:
   * - ./variants/main/googleplay
   * - ./variants/main/xiaomi
   */
  private getMcsCurrentChannelDirPath(): string | undefined {
    if (this.variantOption.mcsCurrent) {
      return fileUtil.getPath(
        true,
        this.variantOption.mcsBase!!,
        this.variantOption.mcsCurrent
      );
    }
  }

  /**
   * get Fcs dir path, eg: ./src
   */
  private getFcsDirPath(): string {
    return fileUtil.getPath(
      true,
      this.variantOption.fcsBase!!,
      this.variantOption.fcsDir!!
    );
  }

  /**
   * it is only possible to get the relative path of a Mcs dir or file
   */
  private getRelativePath(srcPath: string): string | undefined {
    if (this.isMcsMainFilePath(srcPath)) {
      const mcsMainDirPath = this.getMcsMainDirPath();
      const index = srcPath.indexOf(mcsMainDirPath);
      return srcPath.substring(index + mcsMainDirPath.length);
    }

    if (this.isMcsChannelFilePath(srcPath)) {
      const mcsChannelDirPath = this.getMcsCurrentChannelDirPath()!!;
      const index = srcPath.indexOf(mcsChannelDirPath);
      return srcPath.substring(index + mcsChannelDirPath.length);
    }
  }

  /**
   * get the mcs main file path by refer to the mcs channel file path.
   */
  private getMcsMainFilePath(mcsChannelFilePath: string) {
    const relativePath = this.getRelativePath(mcsChannelFilePath);
    if (relativePath) {
      const mcsMainDirPath = this.getMcsMainDirPath();
      return fileUtil.getPath(false, mcsMainDirPath, relativePath);
    }
  }

  /**
   * get the mcs channel file path by refer to the mcs main file path.
   */
  private getMcsChannelFilePath(mcsMainFilePath: string) {
    const relativePath = this.getRelativePath(mcsMainFilePath);
    if (relativePath) {
      const mcsChannelDirPath = this.getMcsCurrentChannelDirPath();
      if (mcsChannelDirPath) {
        return fileUtil.getPath(false, mcsChannelDirPath, relativePath);
      }
    }
  }

  /**
   * get the fcs dir path by refer to the mcs dir path.
   */
  private getFcsFilePath(mcsFilePath: string) {
    const relativePath = this.getRelativePath(mcsFilePath);
    if (relativePath) {
      const fcsDirPath = this.getFcsDirPath();
      return fileUtil.getPath(false, fcsDirPath, relativePath);
    }
  }

  private isMcsMainFilePath(srcPath: string) {
    const mcsMainDirPath = this.getMcsMainDirPath();
    return srcPath.indexOf(mcsMainDirPath) !== -1;
  }

  private isMcsChannelFilePath(srcPath: string) {
    const mcsChannelDirPath = this.getMcsCurrentChannelDirPath();
    return mcsChannelDirPath && srcPath.indexOf(mcsChannelDirPath) !== -1;
  }

  private log(message?: any, ...optionalParams: any[]) {
    if (this.variantOption?.debug) {
      console.log(message, ...optionalParams);
    }
  }
}
