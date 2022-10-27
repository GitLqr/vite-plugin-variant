import type { PluginOption } from "vite";
import { VariantOption } from "./models/VariantOption";
import VariantFilesManager from "./manager/VariantFilesManager";

/**
 *
 * MCS: multiple channel src
 * FCS: final channel src
 *
 * @author GitLqr
 * @since 2022-10-23
 */
export default function vitePluginVariant(
  option?: VariantOption
): PluginOption {
  const manager = new VariantFilesManager(option);
  return {
    name: "vite-plugin-variant",
    enforce: "pre",
    config() {
      console.log(`hook config()`);
    },
    buildStart(options) {
      console.log(`hook buildStart()`);
      manager.syncMcsToFcs();
      manager.startMcsWatcher();
    },
    buildEnd(err?) {
      console.log(`hook buildEnd()`);
      manager.stopMcsWatcher();
    },
  };
}
