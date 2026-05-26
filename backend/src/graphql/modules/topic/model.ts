// interface ITopicComment {
//   topicID: ObjectId;
//   authorID: ObjectId;

//   content: string;

//   parentCommentID?: ObjectId | null;
// }

import { OrkkutDB } from "../../../plugins/mongoose.js";
import { Schema, Types } from "mongoose";

export interface ITopic {
  communityID: Types.ObjectId;
  authorID: Types.ObjectId;

  title: string;
  content: string;

  commentsCount: number;

  pinned: boolean;
  locked: boolean;
}

const topicSchema = new Schema<ITopic>(
  {
    communityID: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },

    authorID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    pinned: {
      type: Boolean,
      default: false,
    },

    locked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const TopicModel = OrkkutDB.model<ITopic>("Topic", topicSchema);

export { TopicModel };
