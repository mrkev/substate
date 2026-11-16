import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts({ tsconfigPath: "tsconfig.src.json" })],
  build: {
    minify: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(import.meta.dirname, "index.ts"),
      name: "linked-state",
      formats: ["es"],
      // the proper extensions will be added
      fileName: "index",
    },
    rolldownOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["react", "react/jsx-runtime", "nanoid"],
    },
  },
});
