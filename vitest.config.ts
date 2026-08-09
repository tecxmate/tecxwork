import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["src/test/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    // Race-condition tests need fresh DB state per file. Force serial
    // execution at the file level — within a file, individual tests
    // still run sequentially via beforeEach truncate.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
    env: {
      // JWT_SECRET is required at module load by lib/auth.ts. Set a
      // deterministic value before any test imports run.
      JWT_SECRET: "test-secret-do-not-use-in-prod",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // see the stub for why this alias exists
      "server-only": path.resolve(__dirname, "src/test/stubs/server-only.ts"),
    },
  },
});
