import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Singleton Prisma client (Prisma 7 driver-adapter style) — avoids
// exhausting connections during Next.js dev-server hot reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  // Hosted Postgres (e.g. Neon) needs TLS with proper verification; the
  // explicit ssl config also silences pg's sslmode=require alias warning.
  const local = !connectionString || /localhost|127\.0\.0\.1/.test(connectionString);
  const adapter = new PrismaPg({
    connectionString,
    ...(local ? {} : { ssl: { rejectUnauthorized: true } }),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
