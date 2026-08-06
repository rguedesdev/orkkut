import type { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

type AuthenticatedUser = {
  id: string;
  email?: string;
  accountType?: string;
  kind?: "onboarding";
};

const authenticateRequest = (request: FastifyRequest): AuthenticatedUser | null => {
  const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    if (typeof decoded !== "object" || !decoded.id) return null;
    return decoded as AuthenticatedUser;
  } catch {
    return null;
  }
};

export { authenticateRequest };
export type { AuthenticatedUser };
