import fs from "fs";
import path from "path";

export function getPath(autoCreate: boolean, ...paths: string[]) {
  const _path = path.isAbsolute(paths[0])
    ? path.join(...paths)
    : path.resolve(...paths);
  if (autoCreate && !isExist(_path)) {
    mkdirs(_path);
  }
  return _path;
}

export function mkdirs(dirPath: string) {
  if (!isExist(dirPath)) {
    mkdirs(path.resolve(dirPath, ".."));
    fs.mkdirSync(dirPath);
  }
}

export function rm(path: string) {
  if (isExist(path)) {
    if (isDir(path)) {
      fs.rmSync(path, { recursive: true });
    } else {
      fs.rmSync(path);
    }
  }
}

export function copyFile(srcFile: string, dstFile: string) {
  // if the srcFile does not exist or not a file, return directly.
  if (!isFile(srcFile)) return;
  // if dstFile is exists, don't copy file when their modify time is the same.
  // TODO: consider using md5 to verify two files.
  if (isExist(dstFile)) {
    const _srcMtime = fs.statSync(srcFile).mtimeMs;
    const _dstMtime = fs.statSync(dstFile).mtimeMs;
    if (_srcMtime !== _dstMtime) fs.copyFileSync(srcFile, dstFile);
  } else {
    // step1. create the dir where the dstFile is located.
    mkdirs(path.resolve(dstFile, ".."));
    // step2. copy file.
    fs.copyFileSync(srcFile, dstFile);
  }
}

export function copyDir(
  srcDir: string,
  dstDir: string,
  isClearOriDstDir: boolean
) {
  // clear original dir
  if (isClearOriDstDir && isExist(dstDir)) {
    fs.rmSync(dstDir, { recursive: true, force: true });
    mkdirs(dstDir);
  }
  const files = fs.readdirSync(srcDir, { withFileTypes: true });
  files.forEach((file) => {
    if (file.isFile()) {
      const _srcFile = path.resolve(srcDir, file.name);
      const _dstFile = path.resolve(dstDir, file.name);
      copyFile(_srcFile, _dstFile);
    } else {
      const _srcDir = path.resolve(srcDir, file.name);
      const _dstDir = path.resolve(dstDir, file.name);
      mkdirs(_dstDir);
      copyDir(_srcDir, _dstDir, false);
    }
  });
}

export function isExist(path: string) {
  return fs.existsSync(path);
}

export function isFile(path: string): boolean {
  return isExist(path) ? fs.statSync(path).isFile() : false;
}

export function isDir(path: string): boolean {
  return isExist(path) ? fs.statSync(path).isDirectory() : false;
}
