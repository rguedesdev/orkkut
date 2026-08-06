const profileInteractionTypeDefs = /* GraphQL */ `
  enum ProfileRatingCategory {
    COOL
    SEXY
    TRUSTWORTHY
  }

  type ProfileRatingSummary {
    visible: Boolean!
    count: Int
    average: Float
    percentage: Float
    level1Count: Int
    level2Count: Int
    level3Count: Int
    viewerValue: Int
  }

  type ProfileSocialInteractions {
    fansVisible: Boolean!
    fanCount: Int
    viewerIsFan: Boolean!
    viewerCanInteract: Boolean!
    viewerIsProfileOwner: Boolean!
    viewerIsFriend: Boolean!
    legal: ProfileRatingSummary!
    sexy: ProfileRatingSummary!
    trustworthy: ProfileRatingSummary!
  }

  input SetProfileRatingInput {
    targetUserID: ID!
    category: ProfileRatingCategory!
    value: Int!
  }

  input RemoveProfileRatingInput {
    targetUserID: ID!
    category: ProfileRatingCategory!
  }

  extend type Mutation {
    becomeProfileFan(targetUserID: ID!): ProfileSocialInteractions!
    removeProfileFan(targetUserID: ID!): ProfileSocialInteractions!
    setProfileRating(data: SetProfileRatingInput!): ProfileSocialInteractions!
    removeProfileRating(data: RemoveProfileRatingInput!): ProfileSocialInteractions!
  }
`;

export { profileInteractionTypeDefs };
