import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"], // Build for both CommonJS and ES Modules
  dts: true, // Generate declaration files (.d.ts)
  clean: true, // Clean the output directory before building
  sourcemap: true,
  splitting: false,
});
