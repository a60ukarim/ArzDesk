import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      include: ["src/features/workspace/{policy,validation,service}.ts"],
    },
  },
});
