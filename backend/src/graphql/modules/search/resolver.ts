// Import Controllers
import UserService from "../user/service.js";
import CommunityService from "../community/service.js";

const searchTypeDefs = /* GraphQL */ `
  extend type Query {
    globalSearch(search: String!): GlobalSearchResults!
  }

  type GlobalSearchResults {
    users: [User!]!
    communities: [Community!]!
  }
`;

const searchResolvers = {
  Query: {
    // (parent, args, context, info)
    globalSearch: async (_: any, { search }: any, context: any) => {
      if (!context.user) {
        throw new Error("Usuário não autenticado!");
      }

      const [users, communities] = await Promise.all([
        UserService.searchUsers(search),
        CommunityService.searchCommunities(search),
      ]);

      return {
        users,
        communities,
      };
    },
  },
};

export { searchTypeDefs, searchResolvers };
