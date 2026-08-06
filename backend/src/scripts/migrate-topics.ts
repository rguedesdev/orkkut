import { OrkkutDB } from "../plugins/mongoose.js";
import { TopicCommentModel } from "../graphql/modules/topic/comment-model.js";
import { LikeModel } from "../graphql/modules/topic/like-model.js";
import { TopicModel } from "../graphql/modules/topic/model.js";

async function migrateTopics() {
  await OrkkutDB.asPromise();

  const topicResult = await TopicModel.updateMany(
    {},
    { $set: { commentsCount: 0, likesCount: 0 } },
  );
  await TopicCommentModel.updateMany({}, { $set: { likesCount: 0 } });

  await TopicCommentModel.updateMany(
    { parentCommentID: null },
    { $set: { replyToCommentID: null, replyToUserID: null } },
  );

  const legacyReplies = await TopicCommentModel.find({
    parentCommentID: { $ne: null },
    $or: [
      { replyToCommentID: { $exists: false } },
      { replyToCommentID: null },
    ],
  }).lean();
  const rootIDs = legacyReplies.map((reply) => reply.parentCommentID);
  const roots = await TopicCommentModel.find({ _id: { $in: rootIDs } })
    .select("_id authorID")
    .lean();
  const rootsByID = new Map(roots.map((root) => [String(root._id), root]));
  const replyOperations = legacyReplies.flatMap((reply) => {
    const root = rootsByID.get(String(reply.parentCommentID));
    return root
      ? [
          {
            updateOne: {
              filter: { _id: reply._id },
              update: {
                $set: {
                  replyToCommentID: root._id,
                  replyToUserID: root.authorID,
                },
              },
            },
          },
        ]
      : [];
  });

  if (replyOperations.length) {
    await TopicCommentModel.bulkWrite(replyOperations);
  }

  const [commentCounts, likeCounts] = await Promise.all([
    TopicCommentModel.aggregate([
      { $group: { _id: "$topicID", count: { $sum: 1 } } },
    ]),
    LikeModel.aggregate([
      {
        $group: {
          _id: { targetType: "$targetType", targetID: "$targetID" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  if (commentCounts.length) {
    await TopicModel.bulkWrite(
      commentCounts.map((item) => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { commentsCount: item.count } },
        },
      })),
    );
  }

  const topicLikes = likeCounts.filter(
    (item) => item._id.targetType === "topic",
  );
  const commentLikes = likeCounts.filter(
    (item) => item._id.targetType === "comment",
  );

  if (topicLikes.length) {
    await TopicModel.bulkWrite(
      topicLikes.map((item) => ({
        updateOne: {
          filter: { _id: item._id.targetID },
          update: { $set: { likesCount: item.count } },
        },
      })),
    );
  }
  if (commentLikes.length) {
    await TopicCommentModel.bulkWrite(
      commentLikes.map((item) => ({
        updateOne: {
          filter: { _id: item._id.targetID },
          update: { $set: { likesCount: item.count } },
        },
      })),
    );
  }

  await Promise.all([
    TopicModel.createIndexes(),
    TopicCommentModel.createIndexes(),
    LikeModel.createIndexes(),
  ]);

  console.log(`Tópicos verificados: ${topicResult.matchedCount}`);
  console.log(`Tópicos atualizados: ${topicResult.modifiedCount}`);
  console.log(`Respostas antigas migradas: ${replyOperations.length}`);
  await OrkkutDB.close();
}

migrateTopics().catch(async (error) => {
  console.error("Falha ao migrar tópicos:", error);
  await OrkkutDB.close();
  process.exitCode = 1;
});
