import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts", "src/hmr.ts"],
  format: ["esm"], // Build for both CommonJS and ES Modules
  dts: true, // Generate declaration files (.d.ts)
  clean: true, // Clean the output directory before building
  external: ["virtual:drupal-hmr-options"],
  esbuildOptions(opts) {
    opts.drop = options.watch ? [] : ["console"];
  },
}));
