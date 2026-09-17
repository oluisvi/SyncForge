import { checkDatabase, createDatabaseClient, loadDatabaseConfig } from "../dist/index.js";
const client = createDatabaseClient(loadDatabaseConfig(process.env));
try {
  await checkDatabase(client);
  console.log("database: ok");
} finally {
  await client.$disconnect();
}
