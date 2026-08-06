const relationshipTypeDefs = /* GraphQL */ `
  enum FriendshipStatus {
    PENDING
    ACCEPTED
    DECLINED
    CANCELED
    REMOVED
  }

  enum UserRelationshipStatus {
    SELF
    NONE
    REQUEST_SENT
    REQUEST_RECEIVED
    FRIENDS
    BLOCKED_BY_VIEWER
    BLOCKED_BY_USER
  }

  type Friendship {
    id: ID!
    requester: User!
    addressee: User!
    friend: User!
    status: FriendshipStatus!
    acceptedAt: String
    declinedAt: String
    canceledAt: String
    removedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type UserRelationship {
    status: UserRelationshipStatus!
    targetUserID: ID!
    requestID: ID
    canSendRequest: Boolean!
    canAcceptRequest: Boolean!
    canDeclineRequest: Boolean!
    canCancelRequest: Boolean!
    canRemoveFriend: Boolean!
    canBlock: Boolean!
    canUnblock: Boolean!
    viewerIsFriend: Boolean!
    viewerIsProfileOwner: Boolean!
  }

  extend type Query {
    myFriends: [Friendship!]!
    friendsOf(userID: ID!): [User!]!
    receivedFriendRequests: [Friendship!]!
    sentFriendRequests: [Friendship!]!
    relationshipWith(userID: ID!): UserRelationship!
    myBlockedUsers: [User!]!
  }

  extend type Mutation {
    sendFriendRequest(targetUserID: ID!): Friendship!
    acceptFriendRequest(requestID: ID!): Friendship!
    declineFriendRequest(requestID: ID!): Friendship!
    cancelFriendRequest(requestID: ID!): Friendship!
    removeFriend(userID: ID!): UserRelationship!
    blockUser(userID: ID!): UserRelationship!
    unblockUser(userID: ID!): UserRelationship!
  }
`;

export { relationshipTypeDefs };
