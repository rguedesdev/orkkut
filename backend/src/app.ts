import Fastify from "fastify";

import { registerCors } from "./plugins/cors.js";
import { registerMercurius } from "./plugins/mercurius.js";
import { registerUploadRoutes } from "./routes/uploads.js";
import { registerMediaCleanupScheduler } from "./services/media-cleanup-scheduler.js";

async function buildApp() {
  const app = Fastify();

  await registerCors(app);
  await registerUploadRoutes(app);
  await registerMercurius(app);
  registerMediaCleanupScheduler(app);

  return app;
}

export default buildApp;
