import { Schema, Types } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";

export const VISIBILITY_LEVELS = ["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"] as const;
export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number];

interface IProfileVisibility {
  avatar: VisibilityLevel;
  profilePhrase: VisibilityLevel;
  about: VisibilityLevel;
  age: VisibilityLevel;
  birthDate: VisibilityLevel;
  gender: VisibilityLevel;
  country: VisibilityLevel;
  sexualOrientation: VisibilityLevel;
  relationshipStatus: VisibilityLevel;
  childrenStatus: VisibilityLevel;
  city: VisibilityLevel;
  smokingStatus: VisibilityLevel;
  drinkingStatus: VisibilityLevel;
  interests: VisibilityLevel;
  passions: VisibilityLevel;
  sports: VisibilityLevel;
  activities: VisibilityLevel;
  socialFans: VisibilityLevel;
  socialCool: VisibilityLevel;
  socialSexy: VisibilityLevel;
  socialTrustworthy: VisibilityLevel;
}

interface IProfile {
  userID: Types.ObjectId;
  avatarImageID?: Types.ObjectId | null;
  profilePhrase?: string | null;
  about?: string | null;
  birthDate?: Date | null;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  gender?: string | null;
  customGender?: string | null;
  relationshipStatus?: string | null;
  childrenStatus?: string | null;
  sexualOrientation?: string | null;
  customSexualOrientation?: string | null;
  smokingStatus?: string | null;
  drinkingStatus?: string | null;
  interests: string[];
  activities: string[];
  visibility: IProfileVisibility;
  createdAt: Date;
  updatedAt: Date;
}

const visibilitySchema = new Schema<IProfileVisibility>(
  {
    avatar: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    profilePhrase: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    about: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    age: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    birthDate: { type: String, enum: VISIBILITY_LEVELS, default: "PRIVATE" },
    gender: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    country: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    sexualOrientation: { type: String, enum: VISIBILITY_LEVELS, default: "PRIVATE" },
    relationshipStatus: { type: String, enum: VISIBILITY_LEVELS, default: "AUTHENTICATED" },
    childrenStatus: { type: String, enum: VISIBILITY_LEVELS, default: "AUTHENTICATED" },
    city: { type: String, enum: VISIBILITY_LEVELS, default: "AUTHENTICATED" },
    smokingStatus: { type: String, enum: VISIBILITY_LEVELS, default: "AUTHENTICATED" },
    drinkingStatus: { type: String, enum: VISIBILITY_LEVELS, default: "AUTHENTICATED" },
    interests: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    passions: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    sports: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    activities: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    socialFans: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    socialCool: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    socialSexy: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
    socialTrustworthy: { type: String, enum: VISIBILITY_LEVELS, default: "PUBLIC" },
  },
  { _id: false },
);

const profileSchema = new Schema<IProfile>(
  {
    userID: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    avatarImageID: { type: Schema.Types.ObjectId, ref: "Media", default: null },
    profilePhrase: { type: String, default: null, maxlength: 280 },
    about: { type: String, default: null, maxlength: 1000 },
    birthDate: { type: Date, default: null },
    countryCode: { type: String, default: null, uppercase: true, minlength: 2, maxlength: 2 },
    region: { type: String, default: null, maxlength: 100 },
    city: { type: String, default: null, maxlength: 100 },
    gender: { type: String, default: null },
    customGender: { type: String, default: null, maxlength: 80 },
    relationshipStatus: { type: String, default: null },
    childrenStatus: { type: String, default: null },
    sexualOrientation: { type: String, default: null },
    customSexualOrientation: { type: String, default: null, maxlength: 80 },
    smokingStatus: { type: String, default: null },
    drinkingStatus: { type: String, default: null },
    interests: { type: [String], default: [] },
    activities: { type: [String], default: [] },
    visibility: { type: visibilitySchema, default: {} },
  },
  { timestamps: true },
);

const ProfileModel = OrkkutDB.model<IProfile>("Profile", profileSchema);

export { ProfileModel };
export type { IProfile, IProfileVisibility };
