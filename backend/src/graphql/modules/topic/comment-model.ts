import { Schema, Types } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";

interface ITopicComment {
  topicID: Types.ObjectId;
  authorID: Types.ObjectId;
  content: string;
  parentCommentID?: Types.ObjectId | null;
  replyToCommentID?: Types.ObjectId | null;
  replyToUserID?: Types.ObjectId | null;
  likesCount: number;
}

const topicCommentSchema = new Schema<ITopicComment>(
  {
    topicID: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    authorID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true },
    parentCommentID: {
      type: Schema.Types.ObjectId,
      ref: "TopicComment",
      default: null,
      index: true,
    },
    replyToCommentID: {
      type: Schema.Types.ObjectId,
      ref: "TopicComment",
      default: null,
      index: true,
    },
    replyToUserID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    likesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

topicCommentSchema.index({ topicID: 1, parentCommentID: 1, createdAt: 1 });

const TopicCommentModel = OrkkutDB.model<ITopicComment>(
  "TopicComment",
  topicCommentSchema,
);

export { TopicCommentModel };
