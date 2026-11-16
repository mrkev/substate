import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defaultClientConditions, defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // React Compiler is available via plugin-react v6's `reactCompilerPreset`
    // (oxc-based). Left disabled, matching the previous config.
    react(),
    tailwindcss(),
  ],
  resolve: {
    // resolve workspace packages (@mrkev/*) to their source, not their dist/,
    // so the site always runs the current code without rebuilding them
    conditions: ["mrkev:source", ...defaultClientConditions],
  },
  build: {
    outDir: "../../docs",
    emptyOutDir: true, // also necessary
    rolldownOptions: {
      input: {
        site: "./index.html",
      },
    },
    minify: false,
  },
  // instead of having absolute paths pointing at assets in `index.html`, use
  // relative paths. Works better with github pages where /assets/foobar.js
  // referes to another site
  base: "./",
});
