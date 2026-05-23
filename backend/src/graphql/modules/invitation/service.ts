// Imports Principais
import crypto from "crypto";

// Models
import { InvitationModel } from "./model.js";
import { UserModel } from "../user/model.js";

class InvitationService {
  static async createInvitation(createdBy: string) {
    if (!createdBy) {
      throw new Error("Usuário não autenticado!");
    }

    const admin = await UserModel.exists({
      _id: createdBy,
      accountType: "admin",
    });

    if (!admin) {
      throw new Error("Apenas administradores podem criar convites!");
    }

    try {
      let code;
      let existingInvitation;

      do {
        code = crypto.randomBytes(16).toString("hex");
        existingInvitation = await InvitationModel.exists({ code });
      } while (existingInvitation);

      const newInvitation = new InvitationModel({
        createdBy,
        code,
      });

      await newInvitation.save();

      return newInvitation.code;
    } catch (error) {
      console.error("Erro ao criar convite:", error);
      throw new Error("Não foi possível criar o convite. Tente novamente.");
    }
  }
}

export default InvitationService;
