import Fastify from "fastify";

import { registerCors } from "./plugins/cors.js";
import { registerMercurius } from "./plugins/mercurius.js";

async function buildApp() {
  const app = Fastify();

  registerCors(app);
  registerMercurius(app);

  return app;
}

export default buildApp;
