import "dotenv/config";

import { defineConfig } from "prisma/config";

const localDevelopmentUrl =
  "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Generation does not need a live database. Runtime code still requires and
    // validates DATABASE_URL before creating a client.
    url: process.env["DATABASE_URL"] ?? localDevelopmentUrl,
  },
});
