const profileTypeDefs = /* GraphQL */ `
  enum ProfileVisibility {
    PUBLIC
    AUTHENTICATED
    FRIENDS
    PRIVATE
  }

  enum Gender {
    MAN
    WOMAN
    NON_BINARY
    OTHER
    UNDISCLOSED
  }

  enum RelationshipStatus {
    SINGLE
    DATING
    ENGAGED
    MARRIED
    CIVIL_UNION
    OPEN_RELATIONSHIP
    SEPARATED
    DIVORCED
    WIDOWED
    COMPLICATED
    UNDISCLOSED
  }

  enum ChildrenStatus {
    NONE
    HAVE
    WANT
    DO_NOT_WANT
    UNDISCLOSED
  }

  enum SexualOrientation {
    HETEROSEXUAL
    HOMOSEXUAL
    BISEXUAL
    PANSEXUAL
    ASEXUAL
    OTHER
    UNDISCLOSED
  }

  enum SmokingStatus {
    NO
    OCCASIONALLY
    YES
    QUITTING
    UNDISCLOSED
  }

  enum DrinkingStatus {
    NO
    SOCIALLY
    OCCASIONALLY
    FREQUENTLY
    UNDISCLOSED
  }

  type Profile {
    id: ID!
    userID: ID!
    avatarImageID: ID
    avatarImage: Media
    profilePhrase: String
    about: String
    birthDate: String
    age: Int
    countryCode: String
    region: String
    city: String
    gender: Gender
    customGender: String
    relationshipStatus: RelationshipStatus
    childrenStatus: ChildrenStatus
    sexualOrientation: SexualOrientation
    customSexualOrientation: String
    smokingStatus: SmokingStatus
    drinkingStatus: DrinkingStatus
    interests: [String!]!
    activities: [String!]!
    passions: [CatalogItem!]!
    sports: [CatalogItem!]!
    visibility: ProfileVisibilitySettings!
    createdAt: String!
    updatedAt: String!
  }

  type ProfileVisibilitySettings {
    avatar: ProfileVisibility!
    profilePhrase: ProfileVisibility!
    about: ProfileVisibility!
    age: ProfileVisibility!
    birthDate: ProfileVisibility!
    gender: ProfileVisibility!
    country: ProfileVisibility!
    sexualOrientation: ProfileVisibility!
    relationshipStatus: ProfileVisibility!
    childrenStatus: ProfileVisibility!
    city: ProfileVisibility!
    smokingStatus: ProfileVisibility!
    drinkingStatus: ProfileVisibility!
    interests: ProfileVisibility!
    passions: ProfileVisibility!
    sports: ProfileVisibility!
    activities: ProfileVisibility!
    socialFans: ProfileVisibility!
    socialCool: ProfileVisibility!
    socialSexy: ProfileVisibility!
    socialTrustworthy: ProfileVisibility!
  }

  input ProfileInput {
    avatarImageID: ID
    profilePhrase: String
    about: String
    birthDate: String
    countryCode: String
    region: String
    city: String
    gender: Gender
    customGender: String
    relationshipStatus: RelationshipStatus
    childrenStatus: ChildrenStatus
    sexualOrientation: SexualOrientation
    customSexualOrientation: String
    smokingStatus: SmokingStatus
    drinkingStatus: DrinkingStatus
    interests: [String!]
    activities: [String!]
    passionIDs: [ID!]
    sportIDs: [ID!]
    visibility: ProfileVisibilityInput
    expectedUpdatedAt: String
  }

  input ProfileVisibilityInput {
    avatar: ProfileVisibility
    profilePhrase: ProfileVisibility
    about: ProfileVisibility
    age: ProfileVisibility
    birthDate: ProfileVisibility
    gender: ProfileVisibility
    country: ProfileVisibility
    sexualOrientation: ProfileVisibility
    relationshipStatus: ProfileVisibility
    childrenStatus: ProfileVisibility
    city: ProfileVisibility
    smokingStatus: ProfileVisibility
    drinkingStatus: ProfileVisibility
    interests: ProfileVisibility
    passions: ProfileVisibility
    sports: ProfileVisibility
    activities: ProfileVisibility
    socialFans: ProfileVisibility
    socialCool: ProfileVisibility
    socialSexy: ProfileVisibility
    socialTrustworthy: ProfileVisibility
  }

  extend type Query {
    countries(locale: String = "pt-BR"): [CountryOption!]!
    myProfile: Profile!
  }

  extend type Mutation {
    updateMyProfile(data: ProfileInput!): Profile!
  }

  type CountryOption {
    code: String!
    name: String!
  }
`;

export { profileTypeDefs };
