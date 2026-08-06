const scrapTypeDefs = /* GraphQL */ `
  enum ScrapViewPermission {
    EVERYONE
    AUTHENTICATED
    FRIENDS
    ONLY_ME
  }

  enum ScrapWritePermission {
    AUTHENTICATED
    FRIENDS
    NOBODY
  }

  type ScrapbookSettings {
    id: ID!
    userID: ID!
    viewPermission: ScrapViewPermission!
    writePermission: ScrapWritePermission!
    allowNotifications: Boolean!
  }

  type ScrapbookViewerState {
    canView: Boolean!
    canWrite: Boolean!
    isOwner: Boolean!
    isFriend: Boolean!
  }

  type Scrap {
    id: ID!
    author: User!
    recipientUserID: ID!
    content: String
    media: [Media!]!
    replyToScrapID: ID
    createdAt: String!
    updatedAt: String!
    editedAt: String
    viewerCanEdit: Boolean!
    viewerCanDelete: Boolean!
    viewerCanReply: Boolean!
  }

  type ScrapEdge {
    node: Scrap!
    cursor: String!
  }

  type ScrapPageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type ScrapConnection {
    edges: [ScrapEdge!]!
    pageInfo: ScrapPageInfo!
    totalCount: Int!
    viewerState: ScrapbookViewerState!
  }

  type DeleteScrapPayload {
    deletedScrapID: ID!
    deletedAt: String!
  }

  input CreateScrapInput {
    recipientUserID: ID!
    content: String
    mediaIDs: [ID!]
    replyToScrapID: ID
    clientMutationID: String
  }

  input UpdateScrapInput {
    scrapID: ID!
    content: String
    mediaIDs: [ID!]
  }

  input UpdateScrapbookSettingsInput {
    viewPermission: ScrapViewPermission!
    writePermission: ScrapWritePermission!
    allowNotifications: Boolean
  }

  extend type Query {
    userScraps(userID: ID!, first: Int = 10, after: String): ScrapConnection!
    myScrapbookSettings: ScrapbookSettings!
  }

  extend type Mutation {
    createScrap(input: CreateScrapInput!): Scrap!
    updateScrap(input: UpdateScrapInput!): Scrap!
    deleteScrap(scrapID: ID!): DeleteScrapPayload!
    updateMyScrapbookSettings(input: UpdateScrapbookSettingsInput!): ScrapbookSettings!
  }
`;

export { scrapTypeDefs };
