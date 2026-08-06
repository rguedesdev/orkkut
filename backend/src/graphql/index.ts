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
import { mediaTypeDefs } from "./modules/media/schema.js";
import { mediaResolvers } from "./modules/media/resolver.js";
import { profileTypeDefs } from "./modules/profile/schema.js";
import { profileResolvers } from "./modules/profile/resolver.js";
import { catalogTypeDefs } from "./modules/catalog/schema.js";
import { catalogResolvers } from "./modules/catalog/resolver.js";
import { relationshipTypeDefs } from "./modules/relationship/schema.js";
import { relationshipResolvers } from "./modules/relationship/resolver.js";
import { profileInteractionTypeDefs } from "./modules/profile-interaction/schema.js";
import { profileInteractionResolvers } from "./modules/profile-interaction/resolver.js";
import { scrapTypeDefs } from "./modules/scrap/schema.js";
import { scrapResolvers } from "./modules/scrap/resolver.js";

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
  mediaTypeDefs,
  profileTypeDefs,
  catalogTypeDefs,
  relationshipTypeDefs,
  profileInteractionTypeDefs,
  scrapTypeDefs,
];

// Combina resolvers
const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...communityResolvers.Query,
    ...searchResolvers.Query,
    ...topicResolvers.Query,
    ...mediaResolvers.Query,
    ...profileResolvers.Query,
    ...catalogResolvers.Query,
    ...relationshipResolvers.Query,
    ...scrapResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...communityResolvers.Mutation,
    ...invitationResolvers.Mutation,
    ...topicResolvers.Mutation,
    ...profileResolvers.Mutation,
    ...relationshipResolvers.Mutation,
    ...profileInteractionResolvers.Mutation,
    ...scrapResolvers.Mutation,
  },

  // Field Resolvers (Customizados)
  Community: {
    ...communityResolvers.Community,
  },

  User: {
    ...userResolvers.User,
  },

  Topic: {
    ...topicResolvers.Topic,
  },

  TopicComment: {
    ...topicResolvers.TopicComment,
  },
  Media: {
    ...mediaResolvers.Media,
  },
  Profile: {
    ...profileResolvers.Profile,
  },
  CatalogItem: {
    ...catalogResolvers.CatalogItem,
  },
  Friendship: {
    ...relationshipResolvers.Friendship,
  },
  Scrap: {
    ...scrapResolvers.Scrap,
  },
};

export { schema, resolvers };
