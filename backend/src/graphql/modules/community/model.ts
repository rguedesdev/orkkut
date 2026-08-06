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
  avatarImageID?: Types.ObjectId | null;
  coverImageID?: Types.ObjectId | null;
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
    avatarImageID: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    coverImageID: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
  },
  { timestamps: true },
);

const CommunityModel = OrkkutDB.model<ICommunity>("Community", communitySchema);

export { CommunityModel };
