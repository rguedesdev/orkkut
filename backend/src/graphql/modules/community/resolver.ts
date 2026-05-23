// Import do Service
import CommunityService from "./service.js";

const communityResolvers = {
  Query: {
    community: (_: any, { id }: any, context: any) => {
      if (!context.user) {
        throw new Error("Usuário não autenticado");
      }

      return CommunityService.getCommunityById(id);
    },

    // searchCommunities: (_: any, { search }: any, context: any) => {
    //   if (!context.user) {
    //     throw new Error("Usuário não autenticado");
    //   }

    //   return CommunityController.searchCommunities(search);
    // },
  },

  Mutation: {
    createCommunity: (_: any, { input }: any, context: any) => {
      if (!context.user) {
        throw new Error("Usuário não autenticado!");
      }

      return CommunityService.createCommunity({
        ...input,
        ownerID: context.user.id,
      });
    },
  },
};

export { communityResolvers };
