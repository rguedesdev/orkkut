const userTypeDefs = /* GraphQL */ `
  type Query {
    me: User
    user(username: String!): User
    usernameAvailable(username: String!): Boolean!
    emailAvailable(email: String!): Boolean!
    invitationStatus(code: String!): InvitationStatus!
  }

  type Mutation {
    validateRegistrationStep(data: RegistrationAccountInput!): RegistrationValidation!
    completeRegistration(
      account: RegistrationAccountInput!
      profile: ProfileInput
      onboardingToken: String!
    ): AuthPayload!
    signIn(data: SignInInput!): AuthPayload!
  }

  type User {
    id: ID!
    name: String!
    username: String!
    email: String
    attributes: Attributes @deprecated(reason: "Use socialInteractions; attributes contém apenas compatibilidade legada.")
    profile: Profile
    relationship: UserRelationship!
    socialInteractions: ProfileSocialInteractions!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type RegistrationValidation {
    onboardingToken: String!
    expiresInSeconds: Int!
  }

  type InvitationStatus {
    valid: Boolean!
    message: String!
  }

  type Attributes {
    fans: Int
    cool: Int
    sexy: Int
    reliable: Int
  }

  input RegistrationAccountInput {
    name: String!
    username: String!
    email: String!
    password: String!
    confirmPassword: String!
    invitation: String!
  }

  input SignInInput {
    login: String!
    password: String!
  }
`;

export { userTypeDefs };
