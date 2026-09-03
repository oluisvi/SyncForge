import "reflect-metadata";

import { startApplication } from "./application.js";

void startApplication().catch(() => {
  console.error("SyncForge API failed to start");
  process.exitCode = 1;
});
