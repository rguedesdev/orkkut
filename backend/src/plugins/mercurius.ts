import Mercurius from "mercurius";
import jwt from "jsonwebtoken";

import type { FastifyInstance } from "fastify";

// Importando configurações do GraphQL
import { schema, resolvers } from "../graphql/index.js";

async function registerMercurius(app: FastifyInstance) {
  await app.register(Mercurius, {
    schema,
    resolvers,
    ide: true,
    path: "/graphql",

    context: async (request, reply) => {
      const authHeader = request.headers.authorization;

      let user = null;

      if (authHeader) {
        const [, token] = authHeader.split(" ");

        try {
          user = jwt.verify(token as string, process.env.JWT_SECRET as string);
        } catch {
          user = null;
        }
      }

      return {
        request,
        reply,
        user,
      };
    },
  });
}

export { registerMercurius };
