import { Schema, Types } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";

const PROFILE_RATING_CATEGORIES = ["COOL", "SEXY", "TRUSTWORTHY"] as const;
type ProfileRatingCategory = (typeof PROFILE_RATING_CATEGORIES)[number];

interface IProfileFan {
  actorUserID: Types.ObjectId;
  targetUserID: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const profileFanSchema = new Schema<IProfileFan>(
  {
    actorUserID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetUserID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);
profileFanSchema.index({ actorUserID: 1, targetUserID: 1 }, { unique: true });
profileFanSchema.index({ targetUserID: 1, createdAt: -1 });

interface IProfileRating {
  actorUserID: Types.ObjectId;
  targetUserID: Types.ObjectId;
  category: ProfileRatingCategory;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

const profileRatingSchema = new Schema<IProfileRating>(
  {
    actorUserID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetUserID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, enum: PROFILE_RATING_CATEGORIES, required: true, index: true },
    value: { type: Number, required: true, min: 1, max: 3, validate: Number.isInteger },
  },
  { timestamps: true },
);
profileRatingSchema.index(
  { actorUserID: 1, targetUserID: 1, category: 1 },
  { unique: true },
);
profileRatingSchema.index({ targetUserID: 1, category: 1 });

const ProfileFanModel = OrkkutDB.model<IProfileFan>("ProfileFan", profileFanSchema);
const ProfileRatingModel = OrkkutDB.model<IProfileRating>("ProfileRating", profileRatingSchema);

export { PROFILE_RATING_CATEGORIES, ProfileFanModel, ProfileRatingModel };
export type { IProfileFan, IProfileRating, ProfileRatingCategory };
