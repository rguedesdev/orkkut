const communityTypeDefs = /* GraphQL */ `
  ### ROOT TYPES ###
  extend type Query {
    community(slug: String!): Community
  }

  extend type Mutation {
    createCommunity(data: CreateCommunityInput!): Community!

    # ADICIONE ESTA LINHA:
    joinCommunity(communityID: ID!): Community!

    leaveCommunity(communityID: ID!): Community!
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
    slug: String!
    description: String!
    category: String!
    privacy: String!
    country: String!
    language: String!
    ownerID: ID!
    moderators: [User]
    members: Int!
    createdAt: String!

    membersList: [CommunityMember!]!
  }

  type CommunityMember {
    role: String!
    user: User!
  }
`;

export { communityTypeDefs };
