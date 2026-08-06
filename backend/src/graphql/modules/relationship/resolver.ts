import { UserModel } from "../user/model.js";
import { requireAuthenticated } from "../topic/authorization.js";
import RelationshipService from "./service.js";

const serializeDate = (value: unknown) => value ? new Date(value as string | Date).toISOString() : null;

const relationshipResolvers = {
  Query: {
    myFriends: (_: unknown, __: unknown, context: any) =>
      RelationshipService.myFriends(requireAuthenticated(context)),
    friendsOf: (_: unknown, { userID }: { userID: string }) =>
      RelationshipService.friendsOf(userID),
    receivedFriendRequests: (_: unknown, __: unknown, context: any) =>
      RelationshipService.receivedRequests(requireAuthenticated(context)),
    sentFriendRequests: (_: unknown, __: unknown, context: any) =>
      RelationshipService.sentRequests(requireAuthenticated(context)),
    relationshipWith: (_: unknown, { userID }: { userID: string }, context: any) =>
      RelationshipService.getRelationship(context.user?.id ?? null, userID),
    myBlockedUsers: (_: unknown, __: unknown, context: any) =>
      RelationshipService.blockedUsers(requireAuthenticated(context)),
  },
  Mutation: {
    sendFriendRequest: (_: unknown, { targetUserID }: { targetUserID: string }, context: any) =>
      RelationshipService.sendFriendRequest(requireAuthenticated(context), targetUserID),
    acceptFriendRequest: (_: unknown, { requestID }: { requestID: string }, context: any) =>
      RelationshipService.acceptFriendRequest(requireAuthenticated(context), requestID),
    declineFriendRequest: (_: unknown, { requestID }: { requestID: string }, context: any) =>
      RelationshipService.declineFriendRequest(requireAuthenticated(context), requestID),
    cancelFriendRequest: (_: unknown, { requestID }: { requestID: string }, context: any) =>
      RelationshipService.cancelFriendRequest(requireAuthenticated(context), requestID),
    removeFriend: (_: unknown, { userID }: { userID: string }, context: any) =>
      RelationshipService.removeFriend(requireAuthenticated(context), userID),
    blockUser: (_: unknown, { userID }: { userID: string }, context: any) =>
      RelationshipService.blockUser(requireAuthenticated(context), userID),
    unblockUser: (_: unknown, { userID }: { userID: string }, context: any) =>
      RelationshipService.unblockUser(requireAuthenticated(context), userID),
  },
  Friendship: {
    id: (parent: any) => String(parent._id ?? parent.id),
    requester: (parent: any) => UserModel.findById(parent.requesterUserID).lean(),
    addressee: (parent: any) => UserModel.findById(parent.addresseeUserID).lean(),
    friend: (parent: any, _: unknown, context: any) => {
      const viewerID = requireAuthenticated(context);
      const friendID = String(parent.requesterUserID) === viewerID
        ? parent.addresseeUserID
        : parent.requesterUserID;
      return UserModel.findById(friendID).lean();
    },
    acceptedAt: (parent: any) => serializeDate(parent.acceptedAt),
    declinedAt: (parent: any) => serializeDate(parent.declinedAt),
    canceledAt: (parent: any) => serializeDate(parent.canceledAt),
    removedAt: (parent: any) => serializeDate(parent.removedAt),
    createdAt: (parent: any) => serializeDate(parent.createdAt),
    updatedAt: (parent: any) => serializeDate(parent.updatedAt),
  },
};

export { relationshipResolvers };
