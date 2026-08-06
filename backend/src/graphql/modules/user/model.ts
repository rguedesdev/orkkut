import { OrkkutDB } from "../../../plugins/mongoose.js";
import { Schema } from "mongoose";

interface IUserAttributes {
  fans: number; // Total de fãs (pessoas)
  cool: number; // Total de votos "legal"
  sexy: number; // Total de votos "sexy"
  trustworthy: number; // Total de votos "confiável"
}

interface IUser {
  accountType: string;
  profilePicture: string;
  name: string;
  username: string;
  email: string;
  password: string;
  gender: string;
  maritalStatus: string;
  city: string;
  country: string;
  phrase: string;
  whoAmI: string;
  dateBirth: string;
  interests: string[];
  relationship: string;
  children: string;
  sexualOrientation: string;
  smoke: string;
  drink: string;
  passions: string[];
  sports: string[];
  atividades: string;
  attributes: IUserAttributes;
}

const attributesSchema = new Schema(
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
    accountType: {
      type: String,
      default: "user",
    },
    profilePicture: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      min: 6,
      max: 15,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 120,
    },
    // Não necessário na criação do usuário
    gender: {
      type: String,
    },
    maritalStatus: {
      type: String,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    phrase: {
      type: String,
    },
    whoAmI: {
      type: String,
    },
    dateBirth: {
      type: String,
    },
    interests: {
      type: [String],
    },
    relationship: {
      type: String,
    },
    children: {
      type: String,
    },
    sexualOrientation: {
      type: String,
    },
    smoke: {
      type: String,
    },
    drink: {
      type: String,
    },
    passions: {
      type: [String],
    },
    sports: {
      type: [String],
    },
    atividades: {
      type: String,
    },
    attributes: {
      type: attributesSchema,
      default: {},
    },
  },
  { timestamps: true },
);

const UserModel = OrkkutDB.model<IUser>("User", userSchema);

export { UserModel };
