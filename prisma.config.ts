import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads .env implicitly, but Next.js does. Mirror Next's
// precedence here so CLI commands and the app agree on DATABASE_URL.
for (const file of [".env", ".env.local"]) {
  if (fs.existsSync(file)) {
    process.loadEnvFile(file);
  }
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
