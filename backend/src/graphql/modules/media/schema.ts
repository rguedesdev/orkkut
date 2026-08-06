const mediaTypeDefs = /* GraphQL */ `
  enum MediaStatus {
    PENDING
    READY
    FAILED
    DELETED
  }

  enum MediaPurpose {
    COMMUNITY_AVATAR
    COMMUNITY_COVER
    TOPIC_FEATURED
    USER_AVATAR
    SCRAP_IMAGE
  }

  type Media {
    id: ID!
    url: String!
    originalName: String!
    mimeType: String!
    size: Int!
    width: Int
    height: Int
    purpose: MediaPurpose!
    status: MediaStatus!
    createdAt: String!
    updatedAt: String!
  }

  extend type Query {
    media(id: ID!): Media
  }
`;

export { mediaTypeDefs };
