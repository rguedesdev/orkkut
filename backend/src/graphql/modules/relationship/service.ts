import { Types, type ClientSession } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";
import { graphQLError } from "../../errors.js";
import { ProfileFanModel, ProfileRatingModel } from "../profile-interaction/model.js";
import { UserModel } from "../user/model.js";
import { FriendshipModel, UserBlockModel } from "./model.js";
import { normalizeUserID, relationshipPairKey } from "./rules.js";

const cleanupSocialInteractions = async (
  firstUserID: string,
  secondUserID: string,
  session: ClientSession,
) => {
  const betweenUsers = {
    $or: [
      { actorUserID: firstUserID, targetUserID: secondUserID },
      { actorUserID: secondUserID, targetUserID: firstUserID },
    ],
  };
  await Promise.all([
    ProfileFanModel.deleteMany(betweenUsers).session(session),
    ProfileRatingModel.deleteMany(betweenUsers).session(session),
  ]);
};

class RelationshipService {
  static async assertTargetExists(targetUserID: unknown) {
    const id = normalizeUserID(targetUserID);
    if (!(await UserModel.exists({ _id: id }))) {
      throw graphQLError("Usuário não encontrado.", "NOT_FOUND");
    }
    return id;
  }

  static async hasActiveBlock(firstUserID: unknown, secondUserID: unknown, session?: ClientSession) {
    const first = normalizeUserID(firstUserID);
    const second = normalizeUserID(secondUserID);
    if (first === second) return false;
    const query = UserBlockModel.exists({
      $or: [
        { blockerUserID: first, blockedUserID: second },
        { blockerUserID: second, blockedUserID: first },
      ],
    });
    if (session) query.session(session);
    return Boolean(await query);
  }

  static async areFriends(firstUserID: unknown, secondUserID: unknown, session?: ClientSession) {
    const pairKey = relationshipPairKey(firstUserID, secondUserID);
    const query = FriendshipModel.exists({ pairKey, status: "ACCEPTED" });
    if (session) query.session(session);
    const [friendship, blocked] = await Promise.all([
      query,
      this.hasActiveBlock(firstUserID, secondUserID, session),
    ]);
    return Boolean(friendship) && !blocked;
  }

  static async assertCanInteractAsFriend(actorUserID: string, targetUserID: unknown, session?: ClientSession) {
    const target = await this.assertTargetExists(targetUserID);
    relationshipPairKey(actorUserID, target);
    if (await this.hasActiveBlock(actorUserID, target, session)) {
      throw graphQLError("Esta interação não está disponível porque existe um bloqueio ativo.", "FORBIDDEN");
    }
    if (!(await this.areFriends(actorUserID, target, session))) {
      throw graphQLError("Somente amigos podem realizar esta ação.", "FORBIDDEN");
    }
    return target;
  }

  static async getRelationship(viewerUserID: string | null, targetUserID: unknown) {
    const target = normalizeUserID(targetUserID);
    if (!viewerUserID) return this.relationshipPayload("NONE", target);
    if (viewerUserID === target) return this.relationshipPayload("SELF", target);

    const pairKey = relationshipPairKey(viewerUserID, target);
    const [friendship, viewerBlock, targetBlock] = await Promise.all([
      FriendshipModel.findOne({ pairKey }).lean(),
      UserBlockModel.exists({ blockerUserID: viewerUserID, blockedUserID: target }),
      UserBlockModel.exists({ blockerUserID: target, blockedUserID: viewerUserID }),
    ]);
    if (viewerBlock) return this.relationshipPayload("BLOCKED_BY_VIEWER", target, friendship?._id);
    if (targetBlock) return this.relationshipPayload("BLOCKED_BY_USER", target, friendship?._id);
    if (friendship?.status === "ACCEPTED") {
      return this.relationshipPayload("FRIENDS", target, friendship._id);
    }
    if (friendship?.status === "PENDING") {
      return this.relationshipPayload(
        String(friendship.requesterUserID) === viewerUserID ? "REQUEST_SENT" : "REQUEST_RECEIVED",
        target,
        friendship._id,
      );
    }
    return this.relationshipPayload("NONE", target, friendship?._id);
  }

  static relationshipPayload(status: string, targetUserID: string, requestID?: unknown) {
    return {
      status,
      targetUserID,
      requestID: requestID ? String(requestID) : null,
      canSendRequest: status === "NONE",
      canAcceptRequest: status === "REQUEST_RECEIVED",
      canDeclineRequest: status === "REQUEST_RECEIVED",
      canCancelRequest: status === "REQUEST_SENT",
      canRemoveFriend: status === "FRIENDS",
      canBlock: !["SELF", "BLOCKED_BY_VIEWER"].includes(status),
      canUnblock: status === "BLOCKED_BY_VIEWER",
      viewerIsFriend: status === "FRIENDS",
      viewerIsProfileOwner: status === "SELF",
    };
  }

  static async sendFriendRequest(requesterUserID: string, targetUserID: unknown) {
    const target = await this.assertTargetExists(targetUserID);
    const pairKey = relationshipPairKey(requesterUserID, target);
    if (await this.hasActiveBlock(requesterUserID, target)) {
      throw graphQLError("Não é possível enviar uma solicitação enquanto existe um bloqueio.", "FORBIDDEN");
    }

    const current = await FriendshipModel.findOne({ pairKey }).lean();
    if (current?.status === "ACCEPTED") {
      throw graphQLError("Vocês já são amigos.", "CONFLICT");
    }
    if (current?.status === "PENDING") {
      if (String(current.requesterUserID) === requesterUserID) {
        throw graphQLError("A solicitação de amizade já foi enviada.", "CONFLICT");
      }
      throw graphQLError("Você já recebeu uma solicitação deste usuário. Aceite-a para continuar.", "CONFLICT");
    }

    const nextRequest = {
      requesterUserID,
      addresseeUserID: target,
      status: "PENDING" as const,
      acceptedAt: null,
      declinedAt: null,
      canceledAt: null,
      removedAt: null,
    };
    try {
      if (!current) {
        return (await FriendshipModel.create({ pairKey, ...nextRequest })).toObject();
      }
      const updated = await FriendshipModel.findOneAndUpdate(
        { _id: current._id, status: current.status, updatedAt: current.updatedAt },
        { $set: nextRequest },
        { new: true },
      ).lean();
      if (!updated) {
        throw graphQLError("A relação foi alterada por outra solicitação. Atualize e tente novamente.", "CONFLICT");
      }
      return updated;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw graphQLError("Já existe uma relação entre estes usuários.", "CONFLICT");
      }
      throw error;
    }
  }

  static async acceptFriendRequest(userID: string, requestID: unknown) {
    const id = normalizeUserID(requestID);
    const request = await FriendshipModel.findOne({
      _id: id,
      addresseeUserID: userID,
      status: "PENDING",
    }).lean();
    if (!request) throw graphQLError("Solicitação recebida não encontrada ou já processada.", "NOT_FOUND");
    if (await this.hasActiveBlock(request.requesterUserID, request.addresseeUserID)) {
      throw graphQLError("Não é possível aceitar esta solicitação porque existe um bloqueio.", "FORBIDDEN");
    }
    const accepted = await FriendshipModel.findOneAndUpdate(
      { _id: id, addresseeUserID: userID, status: "PENDING" },
      { $set: { status: "ACCEPTED", acceptedAt: new Date() } },
      { new: true },
    ).lean();
    if (!accepted) throw graphQLError("A solicitação foi processada por outra operação.", "CONFLICT");
    return accepted;
  }

  static async declineFriendRequest(userID: string, requestID: unknown) {
    const id = normalizeUserID(requestID);
    const request = await FriendshipModel.findOneAndUpdate(
      { _id: id, addresseeUserID: userID, status: "PENDING" },
      { $set: { status: "DECLINED", declinedAt: new Date() } },
      { new: true },
    ).lean();
    if (!request) throw graphQLError("Solicitação recebida não encontrada ou já processada.", "NOT_FOUND");
    return request;
  }

  static async cancelFriendRequest(userID: string, requestID: unknown) {
    const id = normalizeUserID(requestID);
    const request = await FriendshipModel.findOneAndUpdate(
      { _id: id, requesterUserID: userID, status: "PENDING" },
      { $set: { status: "CANCELED", canceledAt: new Date() } },
      { new: true },
    ).lean();
    if (!request) throw graphQLError("Solicitação enviada não encontrada ou já processada.", "NOT_FOUND");
    return request;
  }

  static async removeFriend(userID: string, friendUserID: unknown) {
    const friend = await this.assertTargetExists(friendUserID);
    const pairKey = relationshipPairKey(userID, friend);
    const session = await OrkkutDB.startSession();
    try {
      await session.withTransaction(async () => {
        const result = await FriendshipModel.updateOne(
          { pairKey, status: "ACCEPTED" },
          { $set: { status: "REMOVED", removedAt: new Date() } },
          { session },
        );
        if (result.matchedCount !== 1) {
          throw graphQLError("Amizade ativa não encontrada.", "NOT_FOUND");
        }
        await cleanupSocialInteractions(userID, friend, session);
      });
    } finally {
      await session.endSession();
    }
    return this.getRelationship(userID, friend);
  }

  static myFriends(userID: string) {
    return FriendshipModel.find({
      status: "ACCEPTED",
      $or: [{ requesterUserID: userID }, { addresseeUserID: userID }],
    }).sort({ acceptedAt: -1 }).lean();
  }

  static receivedRequests(userID: string) {
    return FriendshipModel.find({ addresseeUserID: userID, status: "PENDING" })
      .sort({ updatedAt: -1 })
      .lean();
  }

  static sentRequests(userID: string) {
    return FriendshipModel.find({ requesterUserID: userID, status: "PENDING" })
      .sort({ updatedAt: -1 })
      .lean();
  }

  static async friendsOf(userID: unknown) {
    const id = await this.assertTargetExists(userID);
    const friendships = await this.myFriends(id);
    const friendIDs = friendships.map((friendship) =>
      String(friendship.requesterUserID) === id
        ? friendship.addresseeUserID
        : friendship.requesterUserID,
    );
    return UserModel.find({ _id: { $in: friendIDs } }).sort({ name: 1 }).lean();
  }

  static async blockUser(blockerUserID: string, blockedUserID: unknown) {
    const blocked = await this.assertTargetExists(blockedUserID);
    const pairKey = relationshipPairKey(blockerUserID, blocked);
    const session = await OrkkutDB.startSession();
    try {
      await session.withTransaction(async () => {
        await UserBlockModel.updateOne(
          { blockerUserID, blockedUserID: blocked },
          { $setOnInsert: { blockerUserID, blockedUserID: blocked } },
          { upsert: true, session },
        );
        const friendship = await FriendshipModel.findOne({ pairKey }).session(session).lean();
        if (friendship?.status === "PENDING") {
          await FriendshipModel.updateOne(
            { _id: friendship._id, status: "PENDING" },
            { $set: { status: "CANCELED", canceledAt: new Date() } },
            { session },
          );
        } else if (friendship?.status === "ACCEPTED") {
          await FriendshipModel.updateOne(
            { _id: friendship._id, status: "ACCEPTED" },
            { $set: { status: "REMOVED", removedAt: new Date() } },
            { session },
          );
        }
        await cleanupSocialInteractions(blockerUserID, blocked, session);
      });
    } finally {
      await session.endSession();
    }
    return this.getRelationship(blockerUserID, blocked);
  }

  static async unblockUser(blockerUserID: string, blockedUserID: unknown) {
    const blocked = await this.assertTargetExists(blockedUserID);
    relationshipPairKey(blockerUserID, blocked);
    await UserBlockModel.deleteOne({ blockerUserID, blockedUserID: blocked });
    return this.getRelationship(blockerUserID, blocked);
  }

  static async blockedUsers(userID: string) {
    const blocks = await UserBlockModel.find({ blockerUserID: userID }).sort({ createdAt: -1 }).lean();
    return UserModel.find({ _id: { $in: blocks.map((block) => block.blockedUserID) } }).lean();
  }
}

export { cleanupSocialInteractions };
export default RelationshipService;
