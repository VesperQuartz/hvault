import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import removeConsole from "vite-plugin-remove-console";

removeConsole();

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ["mrlectus.local"],
  },
  plugins: [
    tanstackRouter({ autoCodeSplitting: true, target: "react" }),
    viteReact({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
    tailwindcss(),
    devtools({
      removeDevtoolsOnBuild: true,
    }),
    // removeConsole(),
    mkcert({}),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
