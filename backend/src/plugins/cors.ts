import type { FastifyInstance } from "fastify";
import Cors from "@fastify/cors";

async function registerCors(app: FastifyInstance) {
  await app.register(Cors, {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
  });
}

export { registerCors };
