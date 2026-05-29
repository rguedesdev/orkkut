import { OrkkutDB } from "../../../plugins/mongoose.js";
import { Schema, Types } from "mongoose";

export interface ICommunity {
  name: string;
  slug: string;
  description: string;
  category: string;
  privacy: string;
  country: string;
  language: string;
  ownerID: Types.ObjectId;
  moderators: Types.ObjectId[];
  members: number;
}

const communitySchema = new Schema<ICommunity>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: true,
    },
    privacy: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    ownerID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moderators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    members: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const CommunityModel = OrkkutDB.model<ICommunity>("Community", communitySchema);

export { CommunityModel };
