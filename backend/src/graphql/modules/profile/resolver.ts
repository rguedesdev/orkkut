import { requireAuthenticated } from "../topic/authorization.js";
import ProfileService from "./service.js";

const profileResolvers = {
  Query: {
    countries: (_: unknown, { locale }: { locale?: string }) =>
      ProfileService.countryOptions(locale),
    myProfile: (_: unknown, __: unknown, context: any) =>
      ProfileService.ensureForUser(requireAuthenticated(context)),
  },
  Mutation: {
    updateMyProfile: (_: unknown, { data }: any, context: any) =>
      ProfileService.updateMyProfile(requireAuthenticated(context), data),
  },
  Profile: {
    id: (parent: any) => parent._id?.toString() ?? parent.id,
    createdAt: (parent: any) => new Date(parent.createdAt).toISOString(),
    updatedAt: (parent: any) => new Date(parent.updatedAt).toISOString(),
  },
};

export { profileResolvers };
