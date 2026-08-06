import { Types } from "mongoose";

import { graphQLError } from "../../errors.js";

const normalizeUserID = (value: unknown) => {
  const id = String(value ?? "");
  if (!Types.ObjectId.isValid(id)) {
    throw graphQLError("Usuário inválido.", "BAD_USER_INPUT");
  }
  return id;
};

const relationshipPairKey = (firstUserID: unknown, secondUserID: unknown) => {
  const first = normalizeUserID(firstUserID);
  const second = normalizeUserID(secondUserID);
  if (first === second) {
    throw graphQLError("Esta ação não pode ser realizada com o próprio perfil.", "BAD_USER_INPUT");
  }
  return [first, second].sort().join(":");
};

export { normalizeUserID, relationshipPairKey };
