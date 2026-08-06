import { Schema, Types } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";

const FRIENDSHIP_STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "CANCELED", "REMOVED"] as const;
type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];

interface IFriendship {
  pairKey: string;
  requesterUserID: Types.ObjectId;
  addresseeUserID: Types.ObjectId;
  status: FriendshipStatus;
  acceptedAt?: Date | null;
  declinedAt?: Date | null;
  canceledAt?: Date | null;
  removedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new Schema<IFriendship>(
  {
    pairKey: { type: String, required: true, unique: true, index: true },
    requesterUserID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    addresseeUserID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: FRIENDSHIP_STATUSES, required: true, index: true },
    acceptedAt: { type: Date, default: null },
    declinedAt: { type: Date, default: null },
    canceledAt: { type: Date, default: null },
    removedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
friendshipSchema.index({ requesterUserID: 1, status: 1, updatedAt: -1 });
friendshipSchema.index({ addresseeUserID: 1, status: 1, updatedAt: -1 });

interface IUserBlock {
  blockerUserID: Types.ObjectId;
  blockedUserID: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userBlockSchema = new Schema<IUserBlock>(
  {
    blockerUserID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    blockedUserID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);
userBlockSchema.index({ blockerUserID: 1, blockedUserID: 1 }, { unique: true });

const FriendshipModel = OrkkutDB.model<IFriendship>("Friendship", friendshipSchema);
const UserBlockModel = OrkkutDB.model<IUserBlock>("UserBlock", userBlockSchema);

export { FRIENDSHIP_STATUSES, FriendshipModel, UserBlockModel };
export type { FriendshipStatus, IFriendship, IUserBlock };
