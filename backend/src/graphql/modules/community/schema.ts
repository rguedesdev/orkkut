const communityTypeDefs = /* GraphQL */ `
  ### ROOT TYPES ###
  extend type Mutation {
    createCommunity(data: CreateCommunityInput!): Community!
  }

  extend type Query {
    community(id: ID!): Community
    # searchCommunities(search: String!): [Community!]!
  }

  ### INPUTS ###
  input CreateCommunityInput {
    name: String!
    description: String!
    category: String!
    privacy: String!
    country: String!
    language: String!
  }

  ### MAIN TYPE ###
  type Community {
    id: ID!
    name: String!
    description: String!
    category: String!
    privacy: String!
    country: String!
    language: String!
    ownerID: ID!
    moderators: [User]
    members: Int!
    createdAt: String!
  }
`;

export { communityTypeDefs };
