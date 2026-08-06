import { OrkkutDB } from "../../../plugins/mongoose.js";
import { graphQLError } from "../../errors.js";
import { LikeModel } from "./like-model.js";
import { TopicCommentModel } from "./comment-model.js";
import { TopicModel } from "./model.js";
import { TopicValidation } from "./validation.js";
import {
  canDeleteTopic,
  canEditTopic,
  getDeleteContext,
  requireCommunityMember,
} from "./authorization.js";
import MediaService from "../media/service.js";

const serializeTopic = (topic: any) => ({
  ...topic,
  id: topic._id.toString(),
});

class TopicService {
  static async createTopic(data: any) {
    const parsed = TopicValidation.createTopic(data);
    await requireCommunityMember(parsed.communityID, data.authorID);

    if (parsed.featuredImageID) {
      await MediaService.requireAttachable(parsed.featuredImageID, data.authorID, "TOPIC_FEATURED");
    }

    const topic = await TopicModel.create({
      ...parsed,
      authorID: data.authorID,
      commentsCount: 0,
      likesCount: 0,
      pinned: false,
      locked: false,
      featuredImageID: parsed.featuredImageID ?? null,
    });

    if (parsed.featuredImageID) {
      try {
        await MediaService.attach(
          parsed.featuredImageID,
          data.authorID,
          "TOPIC_FEATURED",
          "TOPIC",
          topic._id,
        );
      } catch (error) {
        await TopicModel.deleteOne({ _id: topic._id });
        throw error;
      }
    }

    return serializeTopic(topic.toObject());
  }

  static async updateTopic(id: string, data: any, actorID: string) {
    const parsed = TopicValidation.updateTopic(data);
    const current = await TopicModel.findById(id).lean();
    if (!current) throw graphQLError("Tópico não encontrado.", "NOT_FOUND");
    const permission = await getDeleteContext(current.communityID, actorID);
    if (!canEditTopic({ actorID, authorID: String(current.authorID), ...permission })) {
      throw graphQLError("Você não pode editar este tópico.", "FORBIDDEN");
    }

    const imageProvided = Object.prototype.hasOwnProperty.call(data, "featuredImageID");
    const imageChanged =
      imageProvided &&
      String(parsed.featuredImageID ?? "") !== String(current.featuredImageID ?? "");
    if (imageChanged && parsed.featuredImageID) {
      await MediaService.requireAttachable(parsed.featuredImageID, actorID, "TOPIC_FEATURED");
      await MediaService.attach(
        parsed.featuredImageID,
        actorID,
        "TOPIC_FEATURED",
        "TOPIC",
        id,
      );
    }

    try {
      const updates: Record<string, unknown> = {};
      if (parsed.title !== undefined) updates.title = parsed.title;
      if (parsed.content !== undefined) updates.content = parsed.content;
      if (imageChanged) updates.featuredImageID = parsed.featuredImageID ?? null;
      const updated = await TopicModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!updated) throw graphQLError("Tópico não encontrado.", "NOT_FOUND");
      if (imageChanged && current.featuredImageID) {
        await MediaService.orphan(current.featuredImageID, "TOPIC", id);
      }
      return serializeTopic(updated);
    } catch (error) {
      if (imageChanged && parsed.featuredImageID) {
        await MediaService.orphan(parsed.featuredImageID, "TOPIC", id);
      }
      throw error;
    }
  }

  static async getTopicById(id: string) {
    const topic = await TopicModel.findById(id).lean();
    return topic ? serializeTopic(topic) : null;
  }

  static async getTopicsByCommunity(
    communityID: string,
    page = 1,
    limit = 10,
  ) {
    const pagination = TopicValidation.pagination(page, limit);
    const filter = { communityID };
    const [items, total] = await Promise.all([
      TopicModel.find(filter)
        .sort({ pinned: -1, createdAt: -1 })
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .lean(),
      TopicModel.countDocuments(filter),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

    return {
      items: items.map(serializeTopic),
      total,
      page: pagination.page,
      totalPages,
      hasNextPage: pagination.page < totalPages,
    };
  }

  static async deleteTopic(id: string, actorID: string) {
    const topic = await TopicModel.findById(id).lean();

    if (!topic) {
      throw graphQLError("Tópico não encontrado.", "NOT_FOUND");
    }

    const permission = await getDeleteContext(topic.communityID, actorID);
    if (
      !canDeleteTopic({
        actorID,
        authorID: String(topic.authorID),
        ...permission,
      })
    ) {
      throw graphQLError("Você não pode excluir este tópico.", "FORBIDDEN");
    }

    const session = await OrkkutDB.startSession();
    try {
      await session.withTransaction(async () => {
        const comments = await TopicCommentModel.find({ topicID: topic._id })
          .select("_id")
          .session(session)
          .lean();
        const commentIDs = comments.map((comment) => comment._id);

        await LikeModel.deleteMany({
          targetType: "topic",
          targetID: topic._id,
        }).session(session);
        if (commentIDs.length) {
          await LikeModel.deleteMany({
            targetType: "comment",
            targetID: { $in: commentIDs },
          }).session(session);
        }
        await TopicCommentModel.deleteMany({ topicID: topic._id }).session(
          session,
        );
        await TopicModel.deleteOne({ _id: topic._id }).session(session);
      });
    } finally {
      await session.endSession();
    }

    if (topic.featuredImageID) {
      await MediaService.orphan(topic.featuredImageID, "TOPIC", topic._id);
    }

    return true;
  }
}

export { serializeTopic };
export default TopicService;
