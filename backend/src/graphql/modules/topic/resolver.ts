import TopicService from "./service.js";

import { CommunityModel } from "../community/model.js";

const topicResolvers = {
  Query: {
    topic: (_: any, { id }: any, context: any) => {
      if (!context.user) {
        throw new Error("Usuário não autenticado!");
      }

      return TopicService.getTopicById(id);
    },
  },

  Mutation: {
    createTopic: (_: any, { data }: any, context: any) => {
      if (!context.user) {
        throw new Error("Usuário não autenticado!");
      }

      return TopicService.createTopic({
        ...data,
        authorID: context.user.id,
      });
    },
  },

  // === FIELD REOLVER ===
  Topic: {
    community: async (parent: any) => {
      return CommunityModel.findById(parent.communityID).lean();
    },
  },
};

export { topicResolvers };
