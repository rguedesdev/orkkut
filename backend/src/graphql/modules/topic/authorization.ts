import { Types } from "mongoose";

import { graphQLError } from "../../errors.js";
import { CommunityModel } from "../community/model.js";
import { CommunityMemberModel } from "../community_members/model.js";
import { UserModel } from "../user/model.js";
import {
  canDeleteComment,
  canDeleteTopic,
  canEditCommunity,
  canEditTopic,
} from "./permissions.js";

const requireAuthenticated = (context: any) => {
  if (!context.user?.id) {
    throw graphQLError("Usuário não autenticado!", "UNAUTHENTICATED");
  }

  return String(context.user.id);
};

const requireCommunityMember = async (communityID: unknown, userID: string) => {
  if (!Types.ObjectId.isValid(String(communityID))) {
    throw graphQLError("Comunidade inválida.", "BAD_USER_INPUT");
  }

  const [community, membership] = await Promise.all([
    CommunityModel.exists({ _id: communityID }),
    CommunityMemberModel.findOne({ communityID, userID }).lean(),
  ]);

  if (!community) {
    throw graphQLError("Comunidade não encontrada.", "NOT_FOUND");
  }

  if (!membership) {
    throw graphQLError(
      "Você precisa ser membro da comunidade para realizar esta ação.",
      "FORBIDDEN",
    );
  }

  return membership;
};

const getDeleteContext = async (communityID: unknown, actorID: string) => {
  const [community, actor] = await Promise.all([
    CommunityModel.findById(communityID).select("ownerID").lean(),
    UserModel.findById(actorID).select("accountType").lean(),
  ]);

  if (!community) {
    throw graphQLError("Comunidade não encontrada.", "NOT_FOUND");
  }

  return {
    communityOwnerID: String(community.ownerID),
    isAdmin: actor?.accountType === "admin",
  };
};

const getCommunityManageContext = async (communityID: unknown, actorID: string) => {
  const [community, membership, actor] = await Promise.all([
    CommunityModel.findById(communityID).select("ownerID").lean(),
    CommunityMemberModel.findOne({ communityID, userID: actorID })
      .select("role")
      .lean(),
    UserModel.findById(actorID).select("accountType").lean(),
  ]);
  if (!community) throw graphQLError("Comunidade não encontrada.", "NOT_FOUND");
  return {
    communityOwnerID: String(community.ownerID),
    isModerator: membership?.role === "moderator",
    isAdmin: actor?.accountType === "admin",
  };
};

const requireCanEditCommunity = async (communityID: unknown, actorID: string) => {
  const permission = await getCommunityManageContext(communityID, actorID);
  if (!canEditCommunity({ actorID, ...permission })) {
    throw graphQLError("Você não pode editar esta comunidade.", "FORBIDDEN");
  }
  return permission;
};

export {
  canDeleteComment,
  canDeleteTopic,
  canEditCommunity,
  canEditTopic,
  getCommunityManageContext,
  getDeleteContext,
  requireAuthenticated,
  requireCommunityMember,
  requireCanEditCommunity,
};
