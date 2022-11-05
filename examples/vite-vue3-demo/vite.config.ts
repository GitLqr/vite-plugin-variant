import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import variant from "vite-plugin-variant";

// change it if you want to switch other channel
const currentChannel = "android";
// const currentChannel = "iOS";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    variant({
      mcsCurrent: currentChannel,
      mcsDefine: {
        android: {
          WEBSITE: "https://github.com/GitLqr",
          LANGUAGES: ["java", "kotlin"],
          AUTHOR: {
            name: "lqr",
            age: 18,
          },
        },
        iOS: {
          WEBSITE: "https://github.com/LinXunFeng",
          LANGUAGES: ["swift", "python"],
          AUTHOR: {
            name: "lxf",
            age: 18,
          },
        },
      },
      debug: true,
    }),
    vue(),
  ],
});
