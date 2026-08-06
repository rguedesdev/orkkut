import { Schema, Types } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";

interface ILike {
  userID: Types.ObjectId;
  targetType: "topic" | "comment";
  targetID: Types.ObjectId;
}

const likeSchema = new Schema<ILike>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["topic", "comment"],
      required: true,
    },
    targetID: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true },
);

likeSchema.index(
  { userID: 1, targetType: 1, targetID: 1 },
  { unique: true },
);
likeSchema.index({ targetType: 1, targetID: 1 });

const LikeModel = OrkkutDB.model<ILike>("Like", likeSchema);

export { LikeModel };
