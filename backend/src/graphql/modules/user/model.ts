import { Schema } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";

interface IUserAttributes {
  fans: number;
  cool: number;
  sexy: number;
  trustworthy: number;
}

interface IUser {
  accountType: "user" | "admin";
  name: string;
  username: string;
  email?: string | null;
  passwordHash: string;
  /** Campo legado, removido pela migration após copiar para passwordHash. */
  password?: string;
  /** Agregados legados. Não são mais fonte de verdade das interações sociais. */
  attributes: IUserAttributes;
  createdAt: Date;
  updatedAt: Date;
}

const attributesSchema = new Schema<IUserAttributes>(
  {
    fans: { type: Number, default: 0, min: 0 },
    cool: { type: Number, default: 0, min: 0 },
    sexy: { type: Number, default: 0, min: 0 },
    trustworthy: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    accountType: { type: String, enum: ["user", "admin"], default: "user" },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      minlength: 3,
      maxlength: 30,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    password: { type: String, required: false, select: false },
    attributes: { type: attributesSchema, default: {} },
  },
  { timestamps: true },
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } },
);

const UserModel = OrkkutDB.model<IUser>("User", userSchema);

export { UserModel };
export type { IUser, IUserAttributes };
