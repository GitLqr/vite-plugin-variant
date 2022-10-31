import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import variant from "vite-plugin-variant";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    variant({
      mcsCurrent: process.env.CHANNEL,
      debug: true,
    }),
  ],
});
