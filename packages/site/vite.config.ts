import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // React Compiler is available via plugin-react v6's `reactCompilerPreset`
    // (oxc-based). Left disabled, matching the previous config.
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: "../../docs",
    emptyOutDir: true, // also necessary
    rollupOptions: {
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
