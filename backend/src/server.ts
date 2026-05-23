import Fastify from "fastify";
import Cors from "@fastify/cors";
import mercurius from "mercurius";
import jwt from "jsonwebtoken";

// Importando configurações do GraphQL
import { schema, resolvers } from "./graphql/index.js";

const app = Fastify();

await app.register(Cors, {
  origin: "http://localhost:3000",
  methods: ["POST"],
});

app.register(mercurius, {
  schema,
  resolvers,
  ide: true,
  path: "/graphql",

  context: (request, reply) => {
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

// Rota GET simples
app.get("/", async (request, reply) => {
  reply.status(200).send({ message: "Olá mundo Node" });
  return;
});

const port = 5000;

await app.listen({ port: port });
console.log("Servidor rodando na porta: " + port);
