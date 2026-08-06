import { OrkkutDB } from "../../../plugins/mongoose.js";
import { graphQLError } from "../../errors.js";
import {
  canDeleteComment,
  getDeleteContext,
  requireCommunityMember,
} from "./authorization.js";
import { TopicCommentModel } from "./comment-model.js";
import { LikeModel } from "./like-model.js";
import { TopicModel } from "./model.js";
import {
  resolveReplyMetadata,
  shouldDeleteConversation,
} from "./reply-thread.js";
import { TopicValidation } from "./validation.js";

const serializeComment = (comment: any) => ({
  ...comment,
  id: comment._id.toString(),
});

class CommentService {
  static async createComment(data: any) {
    const parsed = TopicValidation.createComment(data);
    const topic = await TopicModel.findById(parsed.topicID).lean();

    if (!topic) {
      throw graphQLError("Tópico não encontrado.", "NOT_FOUND");
    }
    if (topic.locked) {
      throw graphQLError("Este tópico está bloqueado.", "FORBIDDEN");
    }

    await requireCommunityMember(topic.communityID, data.authorID);

    const replyTargetID =
      parsed.replyToCommentID ?? parsed.parentCommentID ?? null;
    let replyMetadata: ReturnType<typeof resolveReplyMetadata> | null = null;

    if (replyTargetID) {
      const target = await TopicCommentModel.findById(replyTargetID).lean();

      if (!target) {
        throw graphQLError("Comentário respondido não encontrado.", "NOT_FOUND");
      }

      try {
        replyMetadata = resolveReplyMetadata(topic._id, target);
      } catch (error) {
        throw graphQLError(
          error instanceof Error ? error.message : "Referência inválida.",
          "BAD_USER_INPUT",
        );
      }

      if (target.parentCommentID) {
        const root = await TopicCommentModel.findOne({
          _id: replyMetadata.parentCommentID,
          topicID: topic._id,
          parentCommentID: null,
        }).lean();

        if (!root) {
          throw graphQLError(
            "A conversa principal desta resposta não existe.",
            "BAD_USER_INPUT",
          );
        }
      }
    }

    const session = await OrkkutDB.startSession();
    let created: any;
    try {
      await session.withTransaction(async () => {
        const comments = await TopicCommentModel.create(
          [
            {
              topicID: parsed.topicID,
              content: parsed.content,
              parentCommentID: replyMetadata?.parentCommentID ?? null,
              replyToCommentID: replyMetadata?.replyToCommentID ?? null,
              replyToUserID: replyMetadata?.replyToUserID ?? null,
              authorID: data.authorID,
              likesCount: 0,
            },
          ],
          { session },
        );
        created = comments[0];
        await TopicModel.updateOne(
          { _id: topic._id },
          { $inc: { commentsCount: 1 } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    return serializeComment(created.toObject());
  }

  static async getCommentsByTopic(topicID: string, page = 1, limit = 10) {
    const pagination = TopicValidation.pagination(page, limit);
    const filter = { topicID, parentCommentID: null };
    const [parents, total] = await Promise.all([
      TopicCommentModel.find(filter)
        .sort({ createdAt: 1 })
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .lean(),
      TopicCommentModel.countDocuments(filter),
    ]);
    const parentIDs = parents.map((comment) => comment._id);
    const replies = parentIDs.length
      ? await TopicCommentModel.find({ parentCommentID: { $in: parentIDs } })
          .sort({ createdAt: 1 })
          .lean()
      : [];
    const repliesByParent = new Map<string, any[]>();

    for (const reply of replies) {
      const key = String(reply.parentCommentID);
      repliesByParent.set(key, [
        ...(repliesByParent.get(key) ?? []),
        serializeComment(reply),
      ]);
    }

    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
    return {
      items: parents.map((comment) => ({
        ...serializeComment(comment),
        replies: repliesByParent.get(String(comment._id)) ?? [],
      })),
      total,
      page: pagination.page,
      totalPages,
      hasNextPage: pagination.page < totalPages,
    };
  }

  static async deleteComment(id: string, actorID: string) {
    const comment = await TopicCommentModel.findById(id).lean();
    if (!comment) {
      throw graphQLError("Comentário não encontrado.", "NOT_FOUND");
    }

    const topic = await TopicModel.findById(comment.topicID).lean();
    if (!topic) {
      throw graphQLError("Tópico não encontrado.", "NOT_FOUND");
    }

    const permission = await getDeleteContext(topic.communityID, actorID);
    if (
      !canDeleteComment({
        actorID,
        authorID: String(comment.authorID),
        ...permission,
      })
    ) {
      throw graphQLError("Você não pode excluir este comentário.", "FORBIDDEN");
    }

    const replies = shouldDeleteConversation(comment)
      ? await TopicCommentModel.find({ parentCommentID: comment._id })
          .select("_id")
          .lean()
      : [];
    const ids = [comment._id, ...replies.map((reply) => reply._id)];

    const session = await OrkkutDB.startSession();
    try {
      await session.withTransaction(async () => {
        await LikeModel.deleteMany({
          targetType: "comment",
          targetID: { $in: ids },
        }).session(session);
        await TopicCommentModel.deleteMany({ _id: { $in: ids } }).session(
          session,
        );
        await TopicModel.updateOne(
          { _id: topic._id },
          [
            {
              $set: {
                commentsCount: {
                  $max: [0, { $subtract: ["$commentsCount", ids.length] }],
                },
              },
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    return true;
  }
}

export default CommentService;
