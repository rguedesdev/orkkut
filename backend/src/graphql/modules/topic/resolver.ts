import { CommunityModel } from "../community/model.js";
import { UserModel } from "../user/model.js";
import {
  canDeleteComment,
  canDeleteTopic,
  getDeleteContext,
  requireAuthenticated,
} from "./authorization.js";
import CommentService from "./comment-service.js";
import LikeService from "./like-service.js";
import { TopicModel } from "./model.js";
import TopicService from "./service.js";
import MediaService from "../media/service.js";

const topicResolvers: any = {
  Query: {
    topic: (_: any, { id }: any, context: any) => {
      requireAuthenticated(context);
      return TopicService.getTopicById(id);
    },
    topicsByCommunity: (
      _: any,
      { communityID, page, limit }: any,
      context: any,
    ) => {
      requireAuthenticated(context);
      return TopicService.getTopicsByCommunity(communityID, page, limit);
    },
    commentsByTopic: (
      _: any,
      { topicID, page, limit }: any,
      context: any,
    ) => {
      requireAuthenticated(context);
      return CommentService.getCommentsByTopic(topicID, page, limit);
    },
  },

  Mutation: {
    createTopic: (_: any, { data }: any, context: any) =>
      TopicService.createTopic({
        ...data,
        authorID: requireAuthenticated(context),
      }),
    updateTopic: (_: any, { id, data }: any, context: any) =>
      TopicService.updateTopic(id, data, requireAuthenticated(context)),
    deleteTopic: (_: any, { id }: any, context: any) =>
      TopicService.deleteTopic(id, requireAuthenticated(context)),
    createComment: (_: any, { data }: any, context: any) =>
      CommentService.createComment({
        ...data,
        authorID: requireAuthenticated(context),
      }),
    deleteComment: (_: any, { id }: any, context: any) =>
      CommentService.deleteComment(id, requireAuthenticated(context)),
    setTopicLike: (_: any, { topicID, liked }: any, context: any) =>
      LikeService.setLike(
        "topic",
        topicID,
        requireAuthenticated(context),
        liked,
      ),
    setCommentLike: (_: any, { commentID, liked }: any, context: any) =>
      LikeService.setLike(
        "comment",
        commentID,
        requireAuthenticated(context),
        liked,
      ),
  },

  Topic: {
    id: (parent: any) => parent._id?.toString() ?? parent.id,
    author: (parent: any) => UserModel.findById(parent.authorID).lean(),
    community: (parent: any) =>
      CommunityModel.findById(parent.communityID).lean(),
    featuredImage: (parent: any) =>
      parent.featuredImageID ? MediaService.getReadyMedia(parent.featuredImageID) : null,
    likedByMe: (parent: any, _: any, context: any) =>
      LikeService.isLiked("topic", parent._id ?? parent.id, context.user?.id),
    canDelete: async (parent: any, _: any, context: any) => {
      if (!context.user?.id) return false;
      const permission = await getDeleteContext(
        parent.communityID,
        String(context.user.id),
      );
      return canDeleteTopic({
        actorID: String(context.user.id),
        authorID: String(parent.authorID),
        ...permission,
      });
    },
    canEdit: async (parent: any, _: any, context: any) => {
      if (!context.user?.id) return false;
      const permission = await getDeleteContext(
        parent.communityID,
        String(context.user.id),
      );
      return canDeleteTopic({
        actorID: String(context.user.id),
        authorID: String(parent.authorID),
        ...permission,
      });
    },
  },

  TopicComment: {
    id: (parent: any) => parent._id?.toString() ?? parent.id,
    replies: (parent: any) => parent.replies ?? [],
    author: (parent: any) => UserModel.findById(parent.authorID).lean(),
    replyToUser: (parent: any) =>
      parent.replyToUserID
        ? UserModel.findById(parent.replyToUserID).lean()
        : null,
    likedByMe: (parent: any, _: any, context: any) =>
      LikeService.isLiked("comment", parent._id ?? parent.id, context.user?.id),
    canDelete: async (parent: any, _: any, context: any) => {
      if (!context.user?.id) return false;
      const topic = await TopicModel.findById(parent.topicID).lean();
      if (!topic) return false;
      const permission = await getDeleteContext(
        topic.communityID,
        String(context.user.id),
      );
      return canDeleteComment({
        actorID: String(context.user.id),
        authorID: String(parent.authorID),
        ...permission,
      });
    },
  },
};

export { topicResolvers };
