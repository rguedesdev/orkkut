const communityTypeDefs = /* GraphQL */ `
  ### ROOT TYPES ###
  extend type Query {
    community(slug: String!): Community
  }

  extend type Mutation {
    createCommunity(data: CreateCommunityInput!): Community!
    updateCommunity(id: ID!, data: UpdateCommunityInput!): Community!

    joinCommunity(communityID: ID!): Community!

    leaveCommunity(communityID: ID!): Community!
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
    updatedAt: String!
    canEdit: Boolean!
    avatarImageID: ID
    coverImageID: ID
    avatarImage: Media
    coverImage: Media

    membersList: [CommunityMember!]!
  }

  type CommunityMember {
    role: String!
    user: User!
  }

  ### AUX TYPES ###

  ### INPUTS ###
  input CreateCommunityInput {
    name: String!
    description: String!
    category: String!
    privacy: String!
    country: String!
    language: String!
    avatarImageID: ID
    coverImageID: ID
  }

  input UpdateCommunityInput {
    name: String
    description: String
    category: String
    privacy: String
    country: String
    language: String
    avatarImageID: ID
    coverImageID: ID
  }

  ### AUX INPUTS ###
`;

export { communityTypeDefs };
