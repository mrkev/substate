import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: "tsconfig.src.json",
      // tsconfig.src.json includes tests so they're type-checked, but they
      // shouldn't ship. Setting `exclude` replaces the default, so keep
      // node_modules in it. testUtils.ts is only used by tests.
      exclude: [
        "node_modules/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "src/__tests__/**",
        "src/testUtils.ts",
      ],
    }),
  ],
  build: {
    minify: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      name: "structured-state",
      formats: ["es"],
      // the proper extensions will be added
      fileName: "structured-state",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["react", "react/jsx-runtime"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          react: "React",
        },
      },
    },
  },
});
