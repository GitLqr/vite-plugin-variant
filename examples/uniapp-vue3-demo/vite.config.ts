import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import variant from "vite-plugin-variant";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // 注意：variant() 必须在 uni() 之前！
    variant({
      debug: true,
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
    uni(),
  ],
});
