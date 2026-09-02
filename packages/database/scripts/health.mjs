import {
  checkDatabaseHealth,
  createDatabaseClient,
  loadDatabaseConfig,
} from "../dist/index.js";

const config = loadDatabaseConfig(process.env);
const client = createDatabaseClient(config);

try {
  const result = await checkDatabaseHealth(client);
  console.log(JSON.stringify(result));
} finally {
  await client.$disconnect();
}
