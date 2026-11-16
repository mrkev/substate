import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: "tsconfig.src.json",
      // tsconfig.src.json includes tests so they're type-checked, but they
      // shouldn't ship. Setting `exclude` replaces the default, so keep
      // node_modules in it.
      exclude: ["node_modules/**", "**/*.test.ts", "**/*.test.tsx"],
    }),
  ],
  build: {
    minify: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(import.meta.dirname, "index.ts"),
      name: "marked-serializable",
      formats: ["es"],
      // the proper extensions will be added
      fileName: "index",
    },
    rolldownOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["@mrkev/marked-subbable"],
    },
  },
});
