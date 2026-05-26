// Importando Schemas e Resolvers
import { userTypeDefs } from "./modules/user/schema.js";
import { userResolvers } from "./modules/user/resolver.js";

import { communityTypeDefs } from "./modules/community/schema.js";
import { communityResolvers } from "./modules/community/resolver.js";

import { invitationTypeDefs } from "./modules/invitation/schema.js";
import { invitationResolvers } from "./modules/invitation/resolver.js";

import { searchTypeDefs } from "./modules/search/schema.js";
import { searchResolvers } from "./modules/search/resolver.js";

import { topicTypeDefs } from "./modules/topic/schema.js";
import { topicResolvers } from "./modules/topic/resolver.js";

// Combina schemas
// const schema = `
//   ${userTypeDefs}
//   ${communityTypeDefs}
//   ${searchTypeDefs}
//   ${invitationTypeDefs}
// `;
const schema = [
  userTypeDefs,
  communityTypeDefs,
  searchTypeDefs,
  invitationTypeDefs,
  topicTypeDefs,
];

// Combina resolvers
const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...communityResolvers.Query,
    ...searchResolvers.Query,
    ...topicResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...communityResolvers.Mutation,
    ...invitationResolvers.Mutation,
    ...topicResolvers.Mutation,
  },

  // CORRIGIDO: Injeta o Field Resolver de Community (e qualquer outro tipo customizado)
  ...(communityResolvers.Community && {
    Community: communityResolvers.Community,
  }),
};

export { schema, resolvers };
