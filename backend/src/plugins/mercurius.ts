import Mercurius from "mercurius";

import type { FastifyInstance } from "fastify";

// Importando configurações do GraphQL
import { schema, resolvers } from "../graphql/index.js";
import { authenticateRequest } from "../services/auth/authenticate.js";

async function registerMercurius(app: FastifyInstance) {
  await app.register(Mercurius, {
    schema,
    resolvers,
    ide: true,
    path: "/graphql",

    context: async (request, reply) => {
      return {
        request,
        reply,
        user: authenticateRequest(request),
      };
    },
  });
}

export { registerMercurius };
