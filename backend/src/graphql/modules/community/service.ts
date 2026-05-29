// Imports
import slugify from "slugify";

// Models
import { CommunityModel } from "./model.js";
import { CommunityMemberModel } from "../community_members/model.js";

// Validation
import { CommunityValidation } from "./validation.js";

class CommunityService {
  static async createCommunity(data: any) {
    CommunityValidation.createCommunity(data);

    const slug = slugify(data.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const newCommunity = await CommunityModel.create({
      name: data.name,
      slug,
      description: data.description,
      category: data.category,
      privacy: data.privacy,
      country: data.country,
      language: data.language,
      ownerID: data.ownerID,
      moderators: [],
      members: 1,
    });

    await CommunityMemberModel.create({
      communityID: newCommunity._id,
      userID: data.ownerID,
      role: "owner",
    });

    return newCommunity;
  }

  static async getCommunityBySlug(slug: string) {
    const community = await CommunityModel.findOne({ slug }).lean();

    if (!community) return null;

    return {
      ...community,
      id: community._id.toString(),
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

  static async joinCommunity(communityID, userID) {
    // 1. Segurança: Verifica se o usuário já não é membro para não duplicar
    const alreadyMember = await CommunityMemberModel.findOne({
      communityID,
      userID,
    });
    if (alreadyMember) {
      throw new Error("Você já faz parte desta comunidade!");
    }

    // 2. Cria o vínculo na tabela relacional
    await CommunityMemberModel.create({
      communityID,
      userID,
      role: "member", // Entra como membro comum
    });

    // 3. Atualiza o contador de membros na comunidade e a retorna atualizada
    const updatedCommunity = await CommunityModel.findByIdAndUpdate(
      communityID,
      { $inc: { members: 1 } },
      { new: true }, // Retorna o documento já atualizado
    );

    if (!updatedCommunity) {
      throw new Error("Comunidade não encontrada.");
    }

    return updatedCommunity;
  }

  static async leaveCommunity(communityID, userID) {
    // 1. Segurança: Verifica se o usuário de fato é membro antes de tentar tirar
    const isMember = await CommunityMemberModel.findOne({
      communityID,
      userID,
    });

    if (!isMember) {
      throw new Error("Você não faz parte desta comunidade!");
    }

    // 2. Segurança do Orkut: O Dono (owner) não pode simplesmente "abandonar" a comunidade
    // sem antes passar o cargo para outra pessoa, senão ela fica sem dono.
    if (isMember.role === "owner") {
      throw new Error(
        "O proprietário não pode sair da comunidade. Você precisa excluir a comunidade ou passar a propriedade para outro membro antes.",
      );
    }

    // 3. Remove o vínculo da tabela relacional
    await CommunityMemberModel.deleteOne({ communityID, userID });

    // 4. Atualiza o contador de membros, subtraindo 1 (-1)
    const updatedCommunity = await CommunityModel.findByIdAndUpdate(
      communityID,
      { $inc: { members: -1 } },
      { new: true },
    ).lean();

    if (!updatedCommunity) {
      throw new Error("Comunidade não encontrada!");
    }

    // 5. Busca a lista restante de membros para manter o GraphQL feliz e sem nulls
    const members = await CommunityMemberModel.find({ communityID })
      .populate("userID")
      .lean();

    // 6. Envelopa os dados para o formato que o GraphQL espera
    updatedCommunity.membersList = members.map((member) => ({
      role: member.role,
      user: {
        ...member.userID,
        id: (member.userID._id || member.userID.id)?.toString(),
      },
    }));

    return updatedCommunity;
  }
}

export default CommunityService;
