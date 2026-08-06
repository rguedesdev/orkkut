// Imports
import slugify from "slugify";

// Models
import { CommunityModel } from "./model.js";
import { CommunityMemberModel } from "../community_members/model.js";

// Validation
import { CommunityValidation } from "./validation.js";
import MediaService from "../media/service.js";
import { graphQLError } from "../../errors.js";
import { requireCanEditCommunity } from "../topic/authorization.js";

const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

class CommunityService {
  static async createCommunity(data: any) {
    const parsed = CommunityValidation.createCommunity(data);

    if (parsed.avatarImageID) {
      await MediaService.requireAttachable(parsed.avatarImageID, data.ownerID, "COMMUNITY_AVATAR");
    }
    if (parsed.coverImageID) {
      await MediaService.requireAttachable(parsed.coverImageID, data.ownerID, "COMMUNITY_COVER");
    }

    const slug = slugify(data.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const newCommunity = await CommunityModel.create({
      name: parsed.name,
      slug,
      description: parsed.description,
      category: parsed.category,
      privacy: parsed.privacy,
      country: parsed.country,
      language: parsed.language,
      ownerID: data.ownerID,
      moderators: [],
      members: 1,
      avatarImageID: parsed.avatarImageID ?? null,
      coverImageID: parsed.coverImageID ?? null,
    });

    const attached: unknown[] = [];
    try {
      await CommunityMemberModel.create({
        communityID: newCommunity._id,
        userID: data.ownerID,
        role: "owner",
      });
      if (parsed.avatarImageID) {
        await MediaService.attach(
          parsed.avatarImageID,
          data.ownerID,
          "COMMUNITY_AVATAR",
          "COMMUNITY",
          newCommunity._id,
        );
        attached.push(parsed.avatarImageID);
      }
      if (parsed.coverImageID) {
        await MediaService.attach(
          parsed.coverImageID,
          data.ownerID,
          "COMMUNITY_COVER",
          "COMMUNITY",
          newCommunity._id,
        );
        attached.push(parsed.coverImageID);
      }
    } catch (error) {
      await Promise.all(attached.map((id) => MediaService.orphan(id, "COMMUNITY", newCommunity._id)));
      await Promise.all([
        CommunityMemberModel.deleteMany({ communityID: newCommunity._id }),
        CommunityModel.deleteOne({ _id: newCommunity._id }),
      ]);
      throw error;
    }

    return newCommunity;
  }

  static async updateCommunity(id: string, data: any, actorID: string) {
    const parsed = CommunityValidation.updateCommunity(data);
    await requireCanEditCommunity(id, actorID);
    const current = await CommunityModel.findById(id).lean();
    if (!current) throw graphQLError("Comunidade não encontrada.", "NOT_FOUND");

    const avatarChanged =
      hasOwn(data, "avatarImageID") &&
      String(parsed.avatarImageID ?? "") !== String(current.avatarImageID ?? "");
    const coverChanged =
      hasOwn(data, "coverImageID") &&
      String(parsed.coverImageID ?? "") !== String(current.coverImageID ?? "");

    if (avatarChanged && parsed.avatarImageID) {
      await MediaService.requireAttachable(parsed.avatarImageID, actorID, "COMMUNITY_AVATAR");
    }
    if (coverChanged && parsed.coverImageID) {
      await MediaService.requireAttachable(parsed.coverImageID, actorID, "COMMUNITY_COVER");
    }

    const attached: Array<{ id: unknown; purpose: "COMMUNITY_AVATAR" | "COMMUNITY_COVER" }> = [];
    try {
      if (avatarChanged && parsed.avatarImageID) {
        await MediaService.attach(parsed.avatarImageID, actorID, "COMMUNITY_AVATAR", "COMMUNITY", id);
        attached.push({ id: parsed.avatarImageID, purpose: "COMMUNITY_AVATAR" });
      }
      if (coverChanged && parsed.coverImageID) {
        await MediaService.attach(parsed.coverImageID, actorID, "COMMUNITY_COVER", "COMMUNITY", id);
        attached.push({ id: parsed.coverImageID, purpose: "COMMUNITY_COVER" });
      }

      const updates: Record<string, unknown> = {};
      for (const field of ["name", "description", "category", "privacy", "country", "language"] as const) {
        if (parsed[field] !== undefined) updates[field] = parsed[field];
      }
      if (parsed.name !== undefined) {
        updates.slug = slugify(parsed.name, { lower: true, strict: true, trim: true });
      }
      if (avatarChanged) updates.avatarImageID = parsed.avatarImageID ?? null;
      if (coverChanged) updates.coverImageID = parsed.coverImageID ?? null;

      const updated = await CommunityModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
      if (!updated) throw graphQLError("Comunidade não encontrada.", "NOT_FOUND");

      await Promise.all([
        avatarChanged && current.avatarImageID
          ? MediaService.orphan(current.avatarImageID, "COMMUNITY", id)
          : Promise.resolve(),
        coverChanged && current.coverImageID
          ? MediaService.orphan(current.coverImageID, "COMMUNITY", id)
          : Promise.resolve(),
      ]);
      return updated;
    } catch (error) {
      await Promise.all(attached.map(({ id: mediaID }) => MediaService.orphan(mediaID, "COMMUNITY", id)));
      throw error;
    }
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

  static async joinCommunity(communityID: string, userID: string) {
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

  static async leaveCommunity(communityID: string, userID: string) {
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
    const updatedCommunity: any = await CommunityModel.findByIdAndUpdate(
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
