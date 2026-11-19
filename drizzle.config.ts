import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must explicitly target the local disposable development or test database.",
  );
}

const parsedDatabaseUrl = new URL(databaseUrl);
const databaseName = decodeURIComponent(
  parsedDatabaseUrl.pathname.replace(/^\//, ""),
);

if (
  !["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol) ||
  !allowedHosts.has(parsedDatabaseUrl.hostname) ||
  !["tripfinder_dev", "tripfinder_test"].includes(databaseName)
) {
  throw new Error(
    "Drizzle Kit is restricted to the local tripfinder_dev or tripfinder_test database.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});
