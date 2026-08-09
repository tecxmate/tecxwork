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
    // The shared Neon test branch runs at 0.25 CU and every test truncates ~30 tables,
    // so a correct-but-slow setup hook was failing at 20s once the suite passed a hundred
    // tests. These bound a genuine hang without failing honest slowness.
    testTimeout: 60000,
    hookTimeout: 60000,
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
