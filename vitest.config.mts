import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve("src") } },
  test: {
    environment: "node",
    env: { DATABASE_URL: "file:./test.db" },
    globalSetup: "tests/global-setup.ts",
    // Une seule base SQLite partagée : on évite les écritures concurrentes entre fichiers.
    fileParallelism: false,
  },
});
