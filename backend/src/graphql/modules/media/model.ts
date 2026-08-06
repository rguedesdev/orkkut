import { Schema, Types } from "mongoose";

import type { MediaPurpose } from "../../../config/media.js";
import { OrkkutDB } from "../../../plugins/mongoose.js";

export type MediaStatus = "PENDING" | "READY" | "FAILED" | "DELETED";
export type MediaResourceType = "COMMUNITY" | "TOPIC" | "PROFILE" | "SCRAP";

export interface IMedia {
  ownerID: Types.ObjectId;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  purpose: MediaPurpose;
  status: MediaStatus;
  resourceType?: MediaResourceType | null;
  resourceID?: Types.ObjectId | null;
  orphanedAt?: Date | null;
  deletedAt?: Date | null;
  failureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    ownerID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    storageKey: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    purpose: {
      type: String,
      enum: ["COMMUNITY_AVATAR", "COMMUNITY_COVER", "TOPIC_FEATURED", "USER_AVATAR", "SCRAP_IMAGE"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "READY", "FAILED", "DELETED"],
      default: "PENDING",
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ["COMMUNITY", "TOPIC", "PROFILE", "SCRAP"],
      default: null,
    },
    resourceID: { type: Schema.Types.ObjectId, default: null, index: true },
    orphanedAt: { type: Date, default: null, index: true },
    deletedAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
  },
  { timestamps: true },
);

mediaSchema.index({ resourceType: 1, resourceID: 1 });
mediaSchema.index({ status: 1, createdAt: 1 });

const MediaModel = OrkkutDB.model<IMedia>("Media", mediaSchema);

export { MediaModel };
