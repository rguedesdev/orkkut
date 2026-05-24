import { OrkkutDB } from "../../../plugins/mongoose.js";
import { Schema, Types } from "mongoose";

interface ICommunityMember {
  communityID: Types.ObjectId;
  userID: Types.ObjectId;

  role: "member" | "moderator" | "owner";
}

const communityMemberSchema = new Schema<ICommunityMember>(
  {
    communityID: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },

    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["member", "moderator", "owner"],
      default: "member",
    },
  },
  { timestamps: true },
);

communityMemberSchema.index({ communityID: 1, userID: 1 }, { unique: true });

const CommunityMemberModel = OrkkutDB.model<ICommunityMember>(
  "CommunityMember",
  communityMemberSchema,
);

export { CommunityMemberModel };
