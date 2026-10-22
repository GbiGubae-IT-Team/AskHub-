import { startPushWorker } from "./modules/notifications/push/push.worker.js";
import app from "./app.js";
import { bootstrapSuperAdmin } from "./config/bootstrapSuperAdmin.js";
import { env } from "./config/env.js";

const start = async () => {
  await bootstrapSuperAdmin();

  const server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} ...`);
  });
  const stopPushWorker = startPushWorker();
  const shutdown = () => { stopPushWorker(); server.close(); };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
