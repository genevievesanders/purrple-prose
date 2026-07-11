import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Resolved leniently: `prisma generate` runs without a database (e.g.
    // during `npm install` on Vercel, before env vars are injected).
    // Commands that actually connect (migrate deploy/dev) get the real
    // value from the environment.
    url:
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
