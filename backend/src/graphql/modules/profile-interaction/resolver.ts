import { requireAuthenticated } from "../topic/authorization.js";
import ProfileInteractionService from "./service.js";

const profileInteractionResolvers = {
  Mutation: {
    becomeProfileFan: (_: unknown, { targetUserID }: { targetUserID: string }, context: any) =>
      ProfileInteractionService.becomeFan(requireAuthenticated(context), targetUserID),
    removeProfileFan: (_: unknown, { targetUserID }: { targetUserID: string }, context: any) =>
      ProfileInteractionService.removeFan(requireAuthenticated(context), targetUserID),
    setProfileRating: (_: unknown, { data }: { data: unknown }, context: any) =>
      ProfileInteractionService.setRating(requireAuthenticated(context), data),
    removeProfileRating: (_: unknown, { data }: { data: unknown }, context: any) =>
      ProfileInteractionService.removeRating(requireAuthenticated(context), data),
  },
};

export { profileInteractionResolvers };
