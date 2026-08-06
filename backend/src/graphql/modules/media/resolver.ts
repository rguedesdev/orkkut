import { requireAuthenticated } from "../topic/authorization.js";
import MediaService, { mediaUrl } from "./service.js";

const mediaResolvers = {
  Query: {
    media: (_: unknown, { id }: { id: string }, context: any) => {
      requireAuthenticated(context);
      return MediaService.getReadyMedia(id);
    },
  },
  Media: {
    id: (parent: any) => parent._id?.toString() ?? parent.id,
    url: (parent: any) => parent.url ?? mediaUrl(parent),
  },
};

export { mediaResolvers };
