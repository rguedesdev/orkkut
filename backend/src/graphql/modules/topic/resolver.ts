import TopicService from "./service.js";

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
};

export { topicResolvers };
