import type { PluginOption } from "vite";

export default function vitePluginVariant(): PluginOption {
  return {
    name: "vite-plugin-variant",
    enforce: "pre",
    buildStart(options) {},
    buildEnd(err?) {},
  };
}
