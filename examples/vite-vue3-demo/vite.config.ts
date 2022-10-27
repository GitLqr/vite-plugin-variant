import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vitePluginVariant from "vite-plugin-variant";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vitePluginVariant({
      mcsCurrent: process.env.CHANNEL,
      debug: true,
    }),
  ],
});
