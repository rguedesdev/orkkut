import ProfileService from "../profile/service.js";
import ProfileInteractionService from "../profile-interaction/service.js";
import RelationshipService from "../relationship/service.js";
import UserService from "./service.js";

const userResolvers: any = {
  Query: {
    me: (_: unknown, __: unknown, context: any) => UserService.checkUser(context),
    user: (_: unknown, { username }: { username: string }) =>
      UserService.getUserByUsername(username),
    usernameAvailable: (_: unknown, { username }: { username: string }) =>
      UserService.usernameAvailable(username),
    emailAvailable: (_: unknown, { email }: { email: string }) =>
      UserService.emailAvailable(email),
    invitationStatus: (_: unknown, { code }: { code: string }) =>
      UserService.invitationStatus(code),
  },
  Mutation: {
    validateRegistrationStep: (_: unknown, { data }: any) =>
      UserService.validateRegistrationStep(data),
    completeRegistration: (_: unknown, args: any) => UserService.completeRegistration(args),
    signIn: (_: unknown, { data }: any) => UserService.signIn(data),
  },
  User: {
    id: (parent: any) => parent._id?.toString() ?? parent.id?.toString(),
    email: (parent: any, _: unknown, context: any) =>
      String(context.user?.id ?? "") === String(parent._id ?? parent.id)
        ? parent.email ?? null
        : null,
    profile: (parent: any, _: unknown, context: any) =>
      ProfileService.getByUserID(
        parent._id ?? parent.id,
        context.user?.kind === "onboarding" ? null : context.user?.id ?? null,
      ),
    relationship: (parent: any, _: unknown, context: any) =>
      RelationshipService.getRelationship(
        context.user?.kind === "onboarding" ? null : context.user?.id ?? null,
        parent._id ?? parent.id,
      ),
    socialInteractions: (parent: any, _: unknown, context: any) =>
      ProfileInteractionService.getSummary(
        parent._id ?? parent.id,
        context.user?.kind === "onboarding" ? null : context.user?.id ?? null,
      ),
    attributes: async (parent: any, _: unknown, context: any) => {
      const summary = await ProfileInteractionService.getSummary(
        parent._id ?? parent.id,
        context.user?.kind === "onboarding" ? null : context.user?.id ?? null,
      );
      return {
        fans: summary?.fanCount ?? 0,
        cool: summary?.legal.average ? Math.round(summary.legal.average) : 0,
        sexy: summary?.sexy.average ? Math.round(summary.sexy.average) : 0,
        reliable: summary?.trustworthy.average ? Math.round(summary.trustworthy.average) : 0,
      };
    },
  },
};

export { userResolvers };
