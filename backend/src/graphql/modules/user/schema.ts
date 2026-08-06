// Schema é o TypeDefs do GraphQl, mas separado
const userTypeDefs = /* GraphQL */ `
  ### ROOT TYPES ###
  type Query {
    me: User
    user(id: ID!): User
  }

  type Mutation {
    signUp(data: SignUpInput!, confirmPassword: String!): AuthPayload!
    signIn(data: SignInInput!): AuthPayload!
  }

  ### MAIN TYPES ###
  type User {
    id: ID!
    name: String!
    username: String!
    email: String!
    attributes: Attributes
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  ### AUX TYPES ###
  type Attributes {
    fans: Int
    cool: Int
    sexy: Int
    reliable: Int
  }

  ### INPUTS ###
  input SignUpInput {
    invitation: String!
    name: String!
    username: String!
    email: String!
    password: String!
  }

  input SignInInput {
    email: String!
    password: String!
  }
`;

export { userTypeDefs };
