const searchTypeDefs = /* GraphQL */ `
  extend type Query {
    globalSearch(search: String!): GlobalSearchResults!
  }

  type GlobalSearchResults {
    users: [User!]!
    communities: [Community!]!
  }
`;

export { searchTypeDefs };
