import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/index.mjs",
  format: "esm",
  platform: "node",
  target: "node24",
  sourcemap: true,
  external: [],
});
