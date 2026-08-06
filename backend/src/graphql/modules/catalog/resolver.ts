import CatalogService from "./service.js";

const catalogResolvers = {
  Query: {
    passions: (_: unknown, { search }: { search?: string }) =>
      CatalogService.passions(search),
    sports: (_: unknown, { search }: { search?: string }) =>
      CatalogService.sports(search),
  },
  CatalogItem: {
    id: (parent: any) => parent._id?.toString() ?? parent.id,
  },
};

export { catalogResolvers };
