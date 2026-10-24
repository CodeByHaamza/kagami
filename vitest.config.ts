import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unitaires/**/*.{test,test-d}.ts"],
    typecheck: { enabled: true, include: ["tests/unitaires/**/*.test-d.ts"] }
  }
});
