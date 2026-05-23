// Imports principais
import { type FastifyRequest, type FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

// Middlewares
import { getToken } from "./get-token.js";

const checkToken = (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.headers.authorization) {
    reply.status(401).send({ error: "Acesso negado!" });
    return;
  }

  const token = getToken(request);

  if (!token) {
    reply.status(401).send({ message: "Acesso negado!" });
    return;
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET as string);

    (request as any).user = verified;
  } catch (error) {
    console.log(error);
    reply.status(401).send({ message: "Token Inválido!" });
  }
};

export { checkToken };
