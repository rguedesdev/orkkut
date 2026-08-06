import { Schema, Types } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";

interface ICatalogItem {
  name: string;
  slug: string;
  icon?: string | null;
  active: boolean;
  order: number;
}

const catalogSchema = new Schema<ICatalogItem>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    icon: { type: String, default: null },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

interface IProfileCatalogLink {
  profileID: Types.ObjectId;
  catalogID: Types.ObjectId;
}

const profileCatalogLinkSchema = new Schema<IProfileCatalogLink>(
  {
    profileID: { type: Schema.Types.ObjectId, ref: "Profile", required: true, index: true },
    catalogID: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true },
);
profileCatalogLinkSchema.index({ profileID: 1, catalogID: 1 }, { unique: true });

const PassionModel = OrkkutDB.model<ICatalogItem>("Passion", catalogSchema);
const SportModel = OrkkutDB.model<ICatalogItem>("Sport", catalogSchema.clone());
const ProfilePassionModel = OrkkutDB.model<IProfileCatalogLink>(
  "ProfilePassion",
  profileCatalogLinkSchema,
);
const ProfileSportModel = OrkkutDB.model<IProfileCatalogLink>(
  "ProfileSport",
  profileCatalogLinkSchema.clone(),
);

export { PassionModel, ProfilePassionModel, ProfileSportModel, SportModel };
export type { ICatalogItem, IProfileCatalogLink };
