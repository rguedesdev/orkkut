const catalogTypeDefs = /* GraphQL */ `
  type CatalogItem {
    id: ID!
    name: String!
    slug: String!
    icon: String
    active: Boolean!
    order: Int!
  }

  extend type Query {
    passions(search: String): [CatalogItem!]!
    sports(search: String): [CatalogItem!]!
  }
`;

export { catalogTypeDefs };
