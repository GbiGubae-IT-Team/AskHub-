import app from "./app.js";
import { bootstrapSuperAdmin } from "./config/bootstrapSuperAdmin.js";
import { env } from "./config/env.js";

const start = async () => {
  await bootstrapSuperAdmin();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} ...`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
