import { defaultServerConditions, defineConfig, mergeConfig } from "vite";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    // Vitest runs tests in Vite's server (SSR) environment, which reads
    // ssr.resolve.conditions, not resolve.conditions.
    ssr: {
      resolve: {
        // resolve workspace packages (@mrkev/*) to their source, not their
        // dist/, so tests run against the current code without rebuilding them
        conditions: ["mrkev:source", ...defaultServerConditions],
      },
    },
  }),
);
