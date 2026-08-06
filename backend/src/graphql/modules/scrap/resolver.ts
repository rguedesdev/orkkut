import { requireAuthenticated } from "../topic/authorization.js";
import { graphQLError } from "../../errors.js";
import ScrapService from "./service.js";

const requireRegisteredUser = (context: any) => {
  const userID = requireAuthenticated(context);
  if (context.user?.kind === "onboarding") {
    throw graphQLError("Conclua o cadastro para acessar os scraps.", "UNAUTHENTICATED");
  }
  return userID;
};

const optionalRegisteredUser = (context: any) =>
  context.user?.id && context.user?.kind !== "onboarding" ? String(context.user.id) : null;

const scrapResolvers = {
  Query: {
    userScraps: (_: unknown, args: any, context: any) =>
      ScrapService.listScraps(args, optionalRegisteredUser(context)),
    myScrapbookSettings: (_: unknown, __: unknown, context: any) =>
      ScrapService.getSettings(requireRegisteredUser(context)),
  },
  Mutation: {
    createScrap: (_: unknown, { input }: any, context: any) =>
      ScrapService.createScrap(input, requireRegisteredUser(context)),
    updateScrap: (_: unknown, { input }: any, context: any) =>
      ScrapService.updateScrap(input, requireRegisteredUser(context)),
    deleteScrap: (_: unknown, { scrapID }: any, context: any) =>
      ScrapService.deleteScrap(scrapID, requireRegisteredUser(context)),
    updateMyScrapbookSettings: (_: unknown, { input }: any, context: any) =>
      ScrapService.updateSettings(requireRegisteredUser(context), input),
  },
  Scrap: {
    createdAt: (parent: any) => new Date(parent.createdAt).toISOString(),
    updatedAt: (parent: any) => new Date(parent.updatedAt).toISOString(),
    editedAt: (parent: any) => parent.editedAt ? new Date(parent.editedAt).toISOString() : null,
  },
};

export { scrapResolvers };
