const topicTypeDefs = /* GraphQL */ `
  ### ROOT TYPES ###
  extend type Query {
    topic(id: ID!): Topic
    topicsByCommunity(communityID: ID!): [Topic!]!
  }

  extend type Mutation {
    createTopic(data: CreateTopicInput!): Topic!
  }

  ### MAIN TYPES ###
  type Topic {
    id: ID!

    communityID: ID!
    authorID: ID!

    title: String!
    content: String!

    commentsCount: Int!

    pinned: Boolean!
    locked: Boolean!

    createdAt: String!
  }

  ### AUX TYPES ###

  ### INPUTS ###
  input CreateTopicInput {
    communityID: ID!

    title: String!
    content: String!
  }
`;

export { topicTypeDefs };
