import { Schema, Types } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";

const SCRAP_VIEW_PERMISSIONS = ["EVERYONE", "AUTHENTICATED", "FRIENDS", "ONLY_ME"] as const;
const SCRAP_WRITE_PERMISSIONS = ["AUTHENTICATED", "FRIENDS", "NOBODY"] as const;

type ScrapViewPermission = (typeof SCRAP_VIEW_PERMISSIONS)[number];
type ScrapWritePermission = (typeof SCRAP_WRITE_PERMISSIONS)[number];

interface IScrap {
  authorUserID: Types.ObjectId;
  recipientUserID: Types.ObjectId;
  content?: string | null;
  replyToScrapID?: Types.ObjectId | null;
  clientMutationID?: string | null;
  editedAt?: Date | null;
  deletedAt?: Date | null;
  deletedByUserID?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const scrapSchema = new Schema<IScrap>(
  {
    authorUserID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientUserID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, default: null, maxlength: 2000 },
    replyToScrapID: { type: Schema.Types.ObjectId, ref: "Scrap", default: null },
    clientMutationID: { type: String, default: null, maxlength: 100 },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedByUserID: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);
scrapSchema.index({ recipientUserID: 1, deletedAt: 1, createdAt: -1, _id: -1 });
scrapSchema.index({ authorUserID: 1, createdAt: -1 });
scrapSchema.index(
  { authorUserID: 1, clientMutationID: 1 },
  { unique: true, partialFilterExpression: { clientMutationID: { $type: "string" } } },
);

interface IScrapMedia {
  scrapID: Types.ObjectId;
  mediaID: Types.ObjectId;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const scrapMediaSchema = new Schema<IScrapMedia>(
  {
    scrapID: { type: Schema.Types.ObjectId, ref: "Scrap", required: true, index: true },
    mediaID: { type: Schema.Types.ObjectId, ref: "Media", required: true, unique: true },
    position: { type: Number, required: true, min: 0, max: 3 },
  },
  { timestamps: true },
);
scrapMediaSchema.index({ scrapID: 1, position: 1 }, { unique: true });

interface IScrapbookSettings {
  userID: Types.ObjectId;
  viewPermission: ScrapViewPermission;
  writePermission: ScrapWritePermission;
  allowNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scrapbookSettingsSchema = new Schema<IScrapbookSettings>(
  {
    userID: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    viewPermission: { type: String, enum: SCRAP_VIEW_PERMISSIONS, default: "AUTHENTICATED" },
    writePermission: { type: String, enum: SCRAP_WRITE_PERMISSIONS, default: "FRIENDS" },
    allowNotifications: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const ScrapModel = OrkkutDB.model<IScrap>("Scrap", scrapSchema);
const ScrapMediaModel = OrkkutDB.model<IScrapMedia>("ScrapMedia", scrapMediaSchema);
const ScrapbookSettingsModel = OrkkutDB.model<IScrapbookSettings>(
  "ScrapbookSettings",
  scrapbookSettingsSchema,
);

export {
  SCRAP_VIEW_PERMISSIONS,
  SCRAP_WRITE_PERMISSIONS,
  ScrapMediaModel,
  ScrapModel,
  ScrapbookSettingsModel,
};
export type {
  IScrap,
  IScrapMedia,
  IScrapbookSettings,
  ScrapViewPermission,
  ScrapWritePermission,
};
