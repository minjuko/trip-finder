import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://tripfinder_dev:tripfinder_dev@127.0.0.1:5432/tripfinder_dev",
  },
});
