import { OrkkutDB } from "../../../plugins/mongoose.js";
import { graphQLError } from "../../errors.js";
import { requireCommunityMember } from "./authorization.js";
import { TopicCommentModel } from "./comment-model.js";
import { LikeModel } from "./like-model.js";
import { TopicModel } from "./model.js";

type TargetType = "topic" | "comment";

class LikeService {
  static async setLike(
    targetType: TargetType,
    targetID: string,
    userID: string,
    liked: boolean,
  ) {
    const target: any =
      targetType === "topic"
        ? await TopicModel.findById(targetID).lean()
        : await TopicCommentModel.findById(targetID).lean();

    if (!target) {
      throw graphQLError(
        targetType === "topic"
          ? "Tópico não encontrado."
          : "Comentário não encontrado.",
        "NOT_FOUND",
      );
    }

    const topic: any =
      targetType === "topic"
        ? target
        : await TopicModel.findById(target.topicID).lean();
    if (!topic) {
      throw graphQLError("Tópico não encontrado.", "NOT_FOUND");
    }
    await requireCommunityMember(topic.communityID, userID);

    const session = await OrkkutDB.startSession();

    try {
      await session.withTransaction(async () => {
        if (liked) {
          const result = await LikeModel.updateOne(
            { userID, targetType, targetID },
            { $setOnInsert: { userID, targetType, targetID } },
            { upsert: true, session },
          );
          if (result.upsertedCount === 1) {
            if (targetType === "topic") {
              await TopicModel.updateOne(
                { _id: targetID },
                { $inc: { likesCount: 1 } },
                { session },
              );
            } else {
              await TopicCommentModel.updateOne(
                { _id: targetID },
                { $inc: { likesCount: 1 } },
                { session },
              );
            }
          }
        } else {
          const result = await LikeModel.deleteOne(
            { userID, targetType, targetID },
            { session },
          );
          if (result.deletedCount === 1) {
            const update = [
              {
                $set: {
                  likesCount: {
                    $max: [0, { $subtract: ["$likesCount", 1] }],
                  },
                },
              },
            ];
            if (targetType === "topic") {
              await TopicModel.updateOne(
                { _id: targetID },
                update,
                { session },
              );
            } else {
              await TopicCommentModel.updateOne(
                { _id: targetID },
                update,
                { session },
              );
            }
          }
        }
      });
    } catch (error: any) {
      if (!(liked && error?.code === 11000)) {
        throw error;
      }
    } finally {
      await session.endSession();
    }

    return targetType === "topic"
      ? TopicModel.findById(targetID).lean()
      : TopicCommentModel.findById(targetID).lean();
  }

  static async isLiked(
    targetType: TargetType,
    targetID: unknown,
    userID?: string,
  ) {
    if (!userID) return false;
    return Boolean(await LikeModel.exists({ userID, targetType, targetID }));
  }
}

export default LikeService;
