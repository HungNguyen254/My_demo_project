// File: TRAFFIC_SYSTEM_FE/vite.config.js
import { defineConfig } from "vite";
import { resolve } from "node:path";


export default defineConfig({
  appType: "mpa",
  server: {
    port: 5173,
    open: "/html/main.html",
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "html/main.html"),
        map: resolve(__dirname, "html/Map.html"),
        login: resolve(__dirname, "html/login.html"),
        admin: resolve(__dirname, "html/admin.html"),
      },
    },
  },
});
