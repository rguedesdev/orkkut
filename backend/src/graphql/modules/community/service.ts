// Model
import { CommunityModel } from "./model.js";

// Validation
import { CommunityValidation } from "./validation.js";

class CommunityService {
  static async createCommunity(data: any) {
    CommunityValidation.createCommunity(data);

    const newCommunity = await CommunityModel.create({
      name: data.name,
      description: data.description,
      category: data.category,
      privacy: data.privacy,
      country: data.country,
      language: data.language,
      ownerID: data.ownerID,
      moderators: [],
      members: 1,
    });

    return newCommunity;
  }

  static async getCommunityById(id: string) {
    const community = await CommunityModel.findById(id).lean();

    if (!community) return null;

    // O GraphQL vai ler as propriedades deste objeto:
    return {
      ...community, // Espalha name, description, category...
      id: community._id.toString(), // Cria o campo 'id' que o Schema exige usando o valor do '_id'
    };
  }

  static async searchCommunities(search: string) {
    if (!search || search.trim() === "") {
      return [];
    }

    const communities = await CommunityModel.find({
      name: { $regex: search, $options: "i" }, // busca case insensitive
    }).lean();

    return communities.map((community) => ({
      ...community,
      id: community._id.toString(),
    }));
  }
}

export default CommunityService;
