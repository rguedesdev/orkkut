const topicTypeDefs = /* GraphQL */ `
  extend type Query {
    topic(id: ID!): Topic
    topicsByCommunity(
      communityID: ID!
      page: Int = 1
      limit: Int = 10
    ): TopicPage!
    commentsByTopic(
      topicID: ID!
      page: Int = 1
      limit: Int = 10
    ): CommentPage!
  }

  extend type Mutation {
    createTopic(data: CreateTopicInput!): Topic!
    updateTopic(id: ID!, data: UpdateTopicInput!): Topic!
    deleteTopic(id: ID!): Boolean!
    createComment(data: CreateCommentInput!): TopicComment!
    deleteComment(id: ID!): Boolean!
    setTopicLike(topicID: ID!, liked: Boolean!): Topic!
    setCommentLike(commentID: ID!, liked: Boolean!): TopicComment!
  }

  type Topic {
    id: ID!
    communityID: ID!
    authorID: ID!
    title: String!
    content: String!
    commentsCount: Int!
    likesCount: Int!
    likedByMe: Boolean!
    canDelete: Boolean!
    pinned: Boolean!
    locked: Boolean!
    canEdit: Boolean!
    featuredImageID: ID
    featuredImage: Media
    createdAt: String!
    updatedAt: String!
    author: User!
    community: Community!
  }

  type TopicComment {
    id: ID!
    topicID: ID!
    authorID: ID!
    content: String!
    parentCommentID: ID
    replyToCommentID: ID
    replyToUserID: ID
    likesCount: Int!
    likedByMe: Boolean!
    canDelete: Boolean!
    createdAt: String!
    updatedAt: String!
    author: User!
    replyToUser: User
    replies: [TopicComment!]!
  }

  type TopicPage {
    items: [Topic!]!
    total: Int!
    page: Int!
    totalPages: Int!
    hasNextPage: Boolean!
  }

  type CommentPage {
    items: [TopicComment!]!
    total: Int!
    page: Int!
    totalPages: Int!
    hasNextPage: Boolean!
  }

  input CreateTopicInput {
    communityID: ID!
    title: String!
    content: String!
    featuredImageID: ID
  }

  input UpdateTopicInput {
    title: String
    content: String
    featuredImageID: ID
  }

  input CreateCommentInput {
    topicID: ID!
    content: String!
    parentCommentID: ID
    replyToCommentID: ID
  }
`;

export { topicTypeDefs };
