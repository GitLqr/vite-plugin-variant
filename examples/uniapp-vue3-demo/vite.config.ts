import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import variant from "vite-plugin-variant";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // 注意：variant() 必须在 uni() 插件之前
    variant({
      // mcsCurrent: process.env.CHANNEL,
      debug: true,
    }),
    uni(),
  ],
});
