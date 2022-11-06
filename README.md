# Vite Plugin Variant

[中文](README.zh-CN.md)|English

# Introduction

`vite-plugin-variant` is a vite plugin for managing multi-channel differentiated source code. Unlike other vite plugins, the principle of `vite-plugin-variant` is to filter out the current channel files from the multi-channel source code directory, and then update the `src` directory, in other words, the process from the multi-channel src(MCS) to the current channel src(FCS), instead of making some work based on the `src` directory, so it can be very compatible with other vite plugins.

- MCS：multi-channel src
- FCS：final channel src

# Feature

- Support adding, deleting and updating files with immediate effect（HMR）
- Support dynamic switching of channels
- Support for defining multi-channel global variables
- Support All vite projects（including uniapp）

# Usage

## 1、install

```shell
npm i vite-plugin-variant -D
```

## 2、config

Add configuration in `vite.config.ts`：

```ts
import variant from "vite-plugin-variant";

export default defineConfig({
  plugins: [
    variant({
      mcsCurrent: "channelA", // current channel
      mcsDefine: {
        channelA: {}, // global variable for channel A ....
        channelB: {}, // global variable for channel B ....
      },
    }),
    // other plugins
  ],
});
```

> Note：
>
> 1. `variant()` needs to be placed at the first of the plugin list for better compatibility with other plugins.
> 2. Change the value of `mcsCurrent` to switch channels, and it will be automatically redeployed in dev mode。

## 3、Source code directory

1. Create a `variants/main` directory under the same level of `src` to store the default project source code.
2. Create channel directories(such as `channelA`, `channelB`) under the `variants` directory as the source code of each channel difference.

![](https://cdn.jsdelivr.net/gh/FullStackAction/PicBed@resource20220417121922/image/202211061334517.png)

> Note: Assuming that the project needs to go online on two different channels, namely Huawei and Xiaomi, and they display different logo pictures, you can place their own logo pictures in their respective channel directories. If there is no logo picture in one channel, then use the default logo image in the main directory, and the same for other source files.

## 4、Global variable

Configure global variables for each channel in `vite.config.ts`：

```ts
export default defineConfig({
  plugins: [
    variant({
      mcsCurrent: "huawei",
      mcsDefine: {
        xiaomi: {
          WEBSITE: "https://www.mi.com/",
        },
        huawei: {
          WEBSITE: "https://www.huawei.com/",
        },
      },
    }),
  ],
});
```

> Note：
>
> 1. The global variables defined in `mcsDefine` have the same effect as those defined in the `define` option of vite, but `mcsDefine` can better manager the variables of each channel。
> 2. `vite-plugin-variant` will automatically generate `variant-env.d.ts` in the `variants/main` directory based on the global variables of the current channel to prevent TypeScript compilation errors.

You can use the global variables directly in the code：

```ts
import { ref } from "vue";
const flavor = ref(FLAVOR);
const website = ref(WEBSITE);
```

## 5、Other

1. Because the multi-channel source code is in the `variants` directory, and `src` is the output directory of `vite-plugin-variant`, the files undder it will change at any time, so it is recommended to ignore `src` directory in the `.gitignore` file.
2. `vite-plugin-variant` will automatically insert the necessary rules in the `include` option of `tsconfig.json` to avoid the code in the `variants` directory not being recognized by TypeScript and prompting an error.

# License

[MIT © GitLqr-2022](LICENSE)
