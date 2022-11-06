# Vite Plugin Variant

中文|[English](README.md)

# 简介

`vite-plugin-variant` 是一个管理多渠道差异化源码的 `vite` 插件，与其他 `vite` 插件不同，`vite-plugin-variant` 的原理是从多渠道源码目录中过滤出当前渠道的所有源码文件，然后对 `src` 目录进行更新，即从多渠道源码(MCS)到当前渠道源码(FCS)的过程，而不再是基于 `src` 目录做文章，所以与其他 `vite` 插件可以很好的兼容。

- MCS：多渠道源码（multi-channel src）
- FCS：最终渠道源码（final channel src）

# 特性

- 支持添加、删除、更新文件即时生效（HMR）
- 支持动态切换渠道
- 支持定义多渠道全局变量
- 支持各种 vite 工程（包括 uniapp）

# 使用

## 1、安装

```shell
npm i vite-plugin-variant -D
```

## 2、配置

在 `vite.config.ts` 中添加配置：

```ts
import variant from "vite-plugin-variant";

export default defineConfig({
  plugins: [
    variant({
      mcsCurrent: "channelA", // 当前渠道
      mcsDefine: {
        channelA: {}, // 渠道A 的全局变量 ....
        channelB: {}, // 渠道B 的全局变量 ....
      },
    }),
    // other plugins
  ],
});
```

> 注意：
>
> 1. 需要将 `variant()` 放置到插件列表最前，才能与其他插件更好的兼容。
> 2. 修改 `mcsCurrent` 的值即可切换渠道，dev 模式下会自动重新部署。

## 3、源码目录

1. 在 `src` 同级目录下创建 `variants/main` 目录，存放项目的默认工程源码。
2. 在 `variants` 目录下创建渠道目录（如：`channelA`、`channelB`），作为各渠道差异性源码。

![](https://cdn.jsdelivr.net/gh/FullStackAction/PicBed@resource20220417121922/image/202211061334517.png)

> 说明：假设工程需要上线 2 个不同的渠道，分别是华为和小米，它们各自显示的 logo 图片不同，那么可以在各自的渠道目录下放置各自的 logo 图片，如果有一个渠道没有放置 logo 图片，则使用 main 目录下默认的 logo 图片，其他源码文件同理。

## 4、全局变量

在 `vite.config.ts` 中配置各渠道的全局变量：

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

> 注意：
>
> 1. `mcsDefine` 中定义的全局变量跟在 vite 的 define 选项中定义的效果是一样的，但是 `mcsDefine` 能更好的管理各个渠道各自的变量。
> 2. `vite-plugin-variant` 会自动在 `variants/main` 目录下根据当前渠道的全局变量生成 `variant-env.d.ts`，防止 TypeScript 编译报错。

在代码中可以直接使用：

```ts
import { ref } from "vue";
const flavor = ref(FLAVOR);
const website = ref(WEBSITE);
```

## 5、其他

1. 因为多渠道源码都在 `variants` 目录下，而 `src` 作为 `vite-plugin-variant` 的输出目录，其下文件会随时变化，故建议在 `.gitignore` 文件中将 `src` 目录忽略。
2. `vite-plugin-variant` 会自动在 `tsconfig.json` 的 `include` 选项中插入必要的规则，避免 `variants` 目录下代码不被 TypeScript 识别从而提示报错。

# License

[MIT © GitLqr-2022](LICENSE)
