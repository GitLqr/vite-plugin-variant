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
export default function variant(option?: VariantOption): PluginOption {
  const manager = new VariantFilesManager(option);
  manager.log("\ninitTsConfig");
  manager.initTsConfig();
  manager.log("\nsyncMcsToFcs");
  manager.syncMcsToFcs();
  return {
    name: "vite-plugin-variant",
    enforce: "pre",
    config(config, env) {
      manager.log("\nconfigMcsDefine");
      manager.configMcsDefine(config, env);
    },
    buildStart(options) {
      manager.log("\nstartMcsWatcher");
      manager.startMcsWatcher();
    },
    buildEnd(err?) {
      manager.log("\nstopMcsWatcher");
      manager.stopMcsWatcher();
    },
  };
}
