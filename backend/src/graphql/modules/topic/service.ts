import { TopicModel } from "./model.js";
import { CommunityMemberModel } from "../community_members/model.js";

import { TopicValidation } from "./validation.js";

class TopicService {
  static async createTopic(data: any) {
    TopicValidation.createTopic(data);

    const isMember = await CommunityMemberModel.exists({
      communityID: data.communityID,
      userID: data.authorID,
    });

    if (!isMember) {
      throw new Error(
        "Você precisa ser membro da comunidade para criar tópicos!",
      );
    }

    return TopicModel.create({
      communityID: data.communityID,
      authorID: data.authorID,

      title: data.title,
      content: data.content,

      commentsCount: 0,
      pinned: false,
      locked: false,
    });
  }

  static async getTopicById(id: string) {
    const topic = await TopicModel.findById(id).lean();

    if (!topic) {
      return null;
    }

    return {
      ...topic,
      id: topic._id.toString(),
    };
  }
}

export default TopicService;
