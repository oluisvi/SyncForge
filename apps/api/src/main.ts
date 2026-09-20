import { createApplication } from "./application.js";
import { loadApiConfig } from "./config/api.config.js";
const config = loadApiConfig(process.env);
const app = await createApplication();
await app.listen(config.port, "0.0.0.0");
console.log(`SyncForge API listening on :${config.port}`);
