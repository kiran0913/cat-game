import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: mode === "ios" ? "./" : "/cat-game/",
  build: {
    target: "es2020",
    minify: "esbuild",
    cssMinify: true,
    reportCompressedSize: true,
    outDir: "dist",
  },
}));

