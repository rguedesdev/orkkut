import { OrkkutDB } from "../../../plugins/mongoose.js";
import { Schema } from "mongoose";

interface IInvitation {
  createdBy: string;
  code: string;
  used: boolean;
  usedBy?: string;
}

const invitationSchema = new Schema<IInvitation>(
  {
    createdBy: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      type: String,
    },
  },
  { timestamps: true },
);

const InvitationModel = OrkkutDB.model<IInvitation>(
  "Invitation",
  invitationSchema,
);

export { InvitationModel };
