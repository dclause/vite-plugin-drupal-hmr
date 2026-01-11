import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => {
  const common: Options = {
    dts: true,
    splitting: false,
    clean: true,
    // Note: tsup utilise esbuild directement, on utilise donc le type Options['esbuildOptions']
    esbuildOptions(opts) {
      if (!options.watch) {
        opts.drop = ["console"];
      }
    },
  };

  return [
    // 1. Plugin Logic (Node.js)
    {
      ...common,
      entry: ["src/index.ts"],
      format: ["cjs", "esm"],
      external: ["vite"],
      shims: true, // for __dirname  hybrid support CJS/ESM
      outExtension({ format }) {
        return {
          js: format === "cjs" ? ".cjs" : ".js",
        };
      },
    },

    // 2. Client Script (Browser)
    {
      ...common,
      entry: ["src/hmr.ts"],
      format: ["esm"],
      dts: false,
      external: [],
      outExtension() {
        return { js: ".js" };
      },
    },
  ];
});
