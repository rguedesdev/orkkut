import bcrypt from "bcrypt";
import { Types } from "mongoose";

import { createUserToken } from "../../../services/auth/create-user-token.js";
import { getToken } from "../../../services/auth/get-token.js";
import { getUserByToken } from "../../../services/auth/get-user-by-token.js";
import {
  createOnboardingToken,
  verifyOnboardingToken,
} from "../../../services/auth/onboarding-token.js";
import { OrkkutDB } from "../../../plugins/mongoose.js";
import { graphQLError } from "../../errors.js";
import {
  PassionModel,
  ProfilePassionModel,
  ProfileSportModel,
  SportModel,
} from "../catalog/model.js";
import { InvitationModel } from "../invitation/model.js";
import MediaService from "../media/service.js";
import { ProfileModel } from "../profile/model.js";
import { UserModel } from "./model.js";
import {
  normalizeProfileInput,
  emailSchema,
  registrationAccountSchema,
  signInSchema,
  usernameSchema,
} from "./validation.js";

const serializeUser = (user: any) => ({
  ...user,
  id: user._id?.toString() ?? user.id?.toString(),
  email: user.email ?? null,
});

const ensureInvitationAvailable = async (code: string, session?: any) => {
  const query = InvitationModel.findOne({ code, used: false });
  if (session) query.session(session);
  const invitation = await query.lean();
  if (!invitation) throw graphQLError("Convite inválido ou já utilizado.", "BAD_USER_INPUT");
  return invitation;
};

const ensureCatalogIDs = async (passionIDs: string[], sportIDs: string[]) => {
  const [passionCount, sportCount] = await Promise.all([
    PassionModel.countDocuments({ _id: { $in: passionIDs }, active: true }),
    SportModel.countDocuments({ _id: { $in: sportIDs }, active: true }),
  ]);
  if (passionCount !== passionIDs.length) {
    throw graphQLError("Uma ou mais paixões não existem ou estão inativas.", "BAD_USER_INPUT");
  }
  if (sportCount !== sportIDs.length) {
    throw graphQLError("Um ou mais esportes não existem ou estão inativos.", "BAD_USER_INPUT");
  }
};

class UserService {
  static async usernameAvailable(username: string) {
    const normalized = usernameSchema.safeParse(username);
    if (!normalized.success) return false;
    return !(await UserModel.exists({ username: normalized.data }));
  }

  static async emailAvailable(email: string) {
    const normalized = emailSchema.safeParse(email);
    if (!normalized.success) return false;
    return !(await UserModel.exists({ email: normalized.data }));
  }

  static async invitationStatus(code: string) {
    const normalized = code.trim();
    if (!normalized) return { valid: false, message: "Informe o código de convite." };
    const invitation = await InvitationModel.findOne({ code: normalized }).lean();
    if (!invitation) return { valid: false, message: "Convite inexistente." };
    if (invitation.used) return { valid: false, message: "Este convite já foi utilizado." };
    return { valid: true, message: "Convite disponível." };
  }

  static async validateRegistrationStep(data: unknown) {
    const parsed = registrationAccountSchema.parse(data);
    const [usernameAvailable, emailAvailable] = await Promise.all([
      this.usernameAvailable(parsed.username),
      this.emailAvailable(parsed.email),
      ensureInvitationAvailable(parsed.invitation),
    ]);
    if (!usernameAvailable) throw graphQLError("Este username já está em uso.", "CONFLICT");
    if (!emailAvailable) throw graphQLError("Este e-mail já está em uso.", "CONFLICT");

    const userID = new Types.ObjectId().toString();
    return {
      onboardingToken: createOnboardingToken({
        id: userID,
        username: parsed.username,
        email: parsed.email,
        invitation: parsed.invitation,
      }),
      expiresInSeconds: 1800,
    };
  }

  static async completeRegistration(data: any) {
    const account = registrationAccountSchema.parse(data.account);
    const profile = normalizeProfileInput(data.profile);
    let onboarding;
    try {
      onboarding = verifyOnboardingToken(data.onboardingToken);
    } catch {
      throw graphQLError("A validação do cadastro expirou. Volte à primeira etapa.", "BAD_USER_INPUT");
    }
    if (
      onboarding.username !== account.username ||
      onboarding.email !== account.email ||
      onboarding.invitation !== account.invitation
    ) {
      throw graphQLError("Os dados da primeira etapa foram alterados. Valide-os novamente.", "BAD_USER_INPUT");
    }

    const [usernameAvailable, emailAvailable] = await Promise.all([
      this.usernameAvailable(account.username),
      this.emailAvailable(account.email),
      ensureInvitationAvailable(account.invitation),
      ensureCatalogIDs(profile.passionIDs, profile.sportIDs),
      profile.avatarImageID
        ? MediaService.requireAttachable(profile.avatarImageID, onboarding.id, "USER_AVATAR")
        : Promise.resolve(),
    ]);
    if (!usernameAvailable) throw graphQLError("Este username já está em uso.", "CONFLICT");
    if (!emailAvailable) throw graphQLError("Este e-mail já está em uso.", "CONFLICT");

    const passwordHash = await bcrypt.hash(account.password, 12);
    const session = await OrkkutDB.startSession();
    let createdUser: any;
    try {
      await session.withTransaction(async () => {
        const [user] = await UserModel.create(
          [
            {
              _id: new Types.ObjectId(onboarding.id),
              name: account.name,
              username: account.username,
              passwordHash,
              accountType: "user",
              email: account.email,
              attributes: {},
            },
          ],
          { session },
        );
        if (!user) throw new Error("Falha ao criar usuário.");
        createdUser = user;

        const [{ passionIDs, sportIDs, ...profileFields }] = [profile];
        const [createdProfile] = await ProfileModel.create(
          [
            {
              ...profileFields,
              userID: user._id,
              avatarImageID: profile.avatarImageID ?? null,
            },
          ],
          { session },
        );
        if (!createdProfile) throw new Error("Falha ao criar perfil.");

        if (profile.avatarImageID) {
          await MediaService.attach(
            profile.avatarImageID,
            onboarding.id,
            "USER_AVATAR",
            "PROFILE",
            createdProfile._id,
            session,
          );
        }
        if (passionIDs.length) {
          await ProfilePassionModel.insertMany(
            passionIDs.map((catalogID) => ({ profileID: createdProfile._id, catalogID })),
            { session },
          );
        }
        if (sportIDs.length) {
          await ProfileSportModel.insertMany(
            sportIDs.map((catalogID) => ({ profileID: createdProfile._id, catalogID })),
            { session },
          );
        }

        const invitation = await InvitationModel.findOneAndUpdate(
          { code: account.invitation, used: false },
          { $set: { used: true, usedBy: user._id.toString() } },
          { new: true, session },
        );
        if (!invitation) {
          throw graphQLError("O convite foi utilizado durante o cadastro.", "CONFLICT");
        }
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        if (error?.keyPattern?.email || error?.keyValue?.email) {
          throw graphQLError("Este e-mail já está em uso.", "CONFLICT");
        }
        throw graphQLError("Este username já está em uso.", "CONFLICT");
      }
      throw error;
    } finally {
      await session.endSession();
    }

    return { user: serializeUser(createdUser.toObject()), token: createUserToken(createdUser) };
  }

  static async signIn(data: unknown) {
    const parsed = signInSchema.parse(data);
    const normalized = parsed.login.toLowerCase();
    const user = await UserModel.findOne({
      $or: [{ username: normalized }, { email: normalized }],
    })
      .select("+passwordHash +password")
      .lean();
    if (!user) throw graphQLError("Usuário não encontrado.", "UNAUTHENTICATED");

    const hash = user.passwordHash ?? user.password;
    if (!hash || !(await bcrypt.compare(parsed.password, hash))) {
      throw graphQLError("Senha incorreta.", "UNAUTHENTICATED");
    }
    return { user: serializeUser(user), token: createUserToken(user) };
  }

  static async checkUser(context: any) {
    const token = getToken(context.request);
    if (!token) throw graphQLError("Acesso negado.", "UNAUTHENTICATED");
    const user = await getUserByToken(token);
    if (!user) throw graphQLError("Usuário não encontrado.", "NOT_FOUND");
    return serializeUser(user);
  }

  static async searchUsers(search: string) {
    if (!search?.trim()) return [];
    const users = await UserModel.find({
      $or: [
        { name: { $regex: search.trim(), $options: "i" } },
        { username: { $regex: search.trim(), $options: "i" } },
      ],
    }).lean();
    return users.map(serializeUser);
  }

  static async getUserByUsername(username: string) {
    const user = await UserModel.findOne({ username: username.toLowerCase() }).lean();
    if (!user) throw graphQLError("Usuário não encontrado.", "NOT_FOUND");
    return serializeUser(user);
  }
}

export { ensureCatalogIDs, ensureInvitationAvailable, serializeUser };
export default UserService;
