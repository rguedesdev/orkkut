// Import do Service
import CommunityService from "./service.js";

import { CommunityMemberModel } from "../community_members/model.js";

const communityResolvers = {
  Query: {
    community: (_: any, { slug }: any, context: any) => {
      if (!context.user) {
        throw new Error("Usuário não autenticado");
      }

      return CommunityService.getCommunityBySlug(slug);
    },
  },

  Mutation: {
    createCommunity: (_: any, { data }: any, context: any) => {
      if (!context.user) {
        throw new Error("Usuário não autenticado!");
      }

      return CommunityService.createCommunity({
        ...data,
        ownerID: context.user.id,
      });
    },

    joinCommunity: async (_: any, { communityID }: any, context: any) => {
      if (!context.user) {
        throw new Error("Usuário não autenticado!");
      }

      // Passamos o ID da comunidade e o ID do usuário que veio seguro do token/contexto
      return CommunityService.joinCommunity(communityID, context.user.id);
    },

    leaveCommunity: async (_: any, { communityID }: any, context: any) => {
      if (!context.user) {
        throw new Error("Usuário não autenticado!");
      }

      return CommunityService.leaveCommunity(communityID, context.user.id);
    },
  },

  // === FIELD REOLVER ===
  Community: {
    // Resolve o problema do ID mapeado incorretamente entre o MongoDB (_id) e o GraphQL (id)
    id: (parent: any) => parent._id?.toString() || parent.id,

    membersList: async (parent: any) => {
      // O 'parent' é o objeto da comunidade retornado pelo seu 'CommunityService.getCommunityById(id)'
      const members = await CommunityMemberModel.find({
        communityID: parent._id,
      })
        .populate("userID") // Junta com os dados da coleção de usuários
        .lean();

      // Formatamos para bater exatamente com o formato do seu typedef:
      // type CommunityMember { role: String!, user: User! }
      return members.map((member: any) => ({
        role: member.role,
        user: {
          ...member.userID,
          id: member.userID._id?.toString() || member.userID.id,
        },
      }));
    },
  },
};

export { communityResolvers };
