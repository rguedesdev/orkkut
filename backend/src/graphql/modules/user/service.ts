// imports principais
import bcrypt from "bcrypt";
import * as z from "zod";

// Models
import { UserModel } from "./model.js";
import { InvitationModel } from "../invitation/model.js";

// Validation
import { UserValidation } from "./validation.js";

// Auth
import { createUserToken } from "../../../services/auth/create-user-token.js";
import { getToken } from "../../../services/auth/get-token.js";
import { getUserByToken } from "../../../services/auth/get-user-by-token.js";

// Schema Zod para SignUp
const SignUpSchema = z
  .object({
    name: z.string().trim().nonempty(),
    username: z.string().trim().nonempty(),
    email: z.email().trim(),
    password: z.string().trim().min(6).max(120),
    confirmPassword: z.string().trim().min(6).max(120),
    invitation: z.string().trim().nonempty(),
  })
  .refine((data) => data.password === data.confirmPassword);

// Schema Zod para SignIn
const SignInSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(6),
});

class UserService {
  static async signUp(data: any) {
    // 1. valida entrada
    UserValidation.signUp(data);

    // 2. regra de negócio
    const userExist = await UserModel.findOne({ email: data.email });

    if (userExist) {
      throw new Error("Email já cadastrado!");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // 3. persistência
    const invitationDoc = await InvitationModel.findOneAndUpdate(
      {
        code: data.invitation,
        used: false,
      },
      { used: true },
      { new: true },
    );

    if (!invitationDoc) {
      throw new Error("Convite inválido ou já utilizado!");
    }

    const newUser = await UserModel.create({
      ...data,
      password: passwordHash,
    });

    await InvitationModel.updateOne(
      { _id: invitationDoc._id },
      { usedBy: newUser._id.toString() },
    );

    const token = createUserToken(newUser);

    return {
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        attributes: {
          fans: newUser.attributes?.fans ?? 0,
          cool: newUser.attributes?.cool ?? 0,
          sexy: newUser.attributes?.sexy ?? 0,
          trustworthy: newUser.attributes?.trustworthy ?? 0,
        },
      },
      token,
    };
  }

  static async signIn(data: any) {
    // 1. valida entrada
    UserValidation.signIn(data);

    // 2. regra de negócio
    const user = await UserModel.findOne({ email: data.email });
    // const user = await UserModel.findOne({
    //   $or: [{ email: data.login }, { username: data.login }],
    // });

    if (!user) {
      throw new Error("Usuário não encontrado!");
    }

    const passwordHash = user.password;

    // `user.password` é o hash armazenado
    const verifyPassword = await bcrypt.compare(data.password, passwordHash);

    if (!verifyPassword) {
      throw new Error("Senha incorreta!");
    }

    const token = createUserToken(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  }

  static async checkUser(context: any) {
    const token = getToken(context.request);
    if (!token) throw new Error("Acesso negado!");

    const user = await getUserByToken(token);
    if (!user) throw new Error("Usuário não encontrado!");

    return {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      attributes: {
        fans: user.attributes?.fans ?? 0,
        cool: user.attributes?.cool ?? 0,
        sexy: user.attributes?.sexy ?? 0,
        reliable: user.attributes?.reliable ?? 0,
      },
    };
  }

  static async searchUsers(search: string) {
    if (!search || search.trim() === "") {
      return [];
    }

    const users = await UserModel.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ],
    }).lean();

    return users.map((user) => ({
      ...user,
      id: user._id.toString(),
    }));
  }

  static async getUserById(id: string) {
    const user = await UserModel.findById(id).lean();

    if (!user) {
      throw new Error("Usuário não encontrado!");
    }

    return {
      ...user,
      id: user._id.toString(),
    };
  }
}
export default UserService;
