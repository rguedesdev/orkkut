import { Buffer } from "node:buffer";
import { Types } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";
import { graphQLError } from "../../errors.js";
import { MediaModel } from "../media/model.js";
import MediaService, { serializeMedia } from "../media/service.js";
import RelationshipService from "../relationship/service.js";
import { UserModel } from "../user/model.js";
import { scrapEvents, type ScrapCreatedEvent } from "./events.js";
import { ScrapMediaModel, ScrapModel, ScrapbookSettingsModel } from "./model.js";
import { canDeleteScrap, canEditScrap, canViewScrapbook, canWriteScrapbook } from "./rules.js";
import { createScrapSchema, pageSchema, settingsSchema, updateScrapSchema } from "./validation.js";

const DEFAULT_SETTINGS = {
  viewPermission: "AUTHENTICATED" as const,
  writePermission: "FRIENDS" as const,
  allowNotifications: true,
};

const encodeCursor = (scrap: any) => Buffer.from(JSON.stringify({
  createdAt: new Date(scrap.createdAt).toISOString(),
  id: String(scrap._id),
})).toString("base64url");

const decodeCursor = (cursor: string) => {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime()) || !Types.ObjectId.isValid(parsed.id)) throw new Error();
    return { createdAt, id: new Types.ObjectId(parsed.id) };
  } catch {
    throw graphQLError("Cursor de paginação inválido.", "BAD_USER_INPUT");
  }
};

class ScrapService {
  static async getSettings(userID: string) {
    const settings = await ScrapbookSettingsModel.findOne({ userID }).lean();
    return settings ? { ...settings, id: settings._id.toString() } : { id: `default:${userID}`, userID, ...DEFAULT_SETTINGS };
  }

  static async getViewerState(ownerID: string, viewerID: string | null) {
    if (!(await UserModel.exists({ _id: ownerID }))) {
      throw graphQLError("Usuário não encontrado.", "NOT_FOUND");
    }
    const isOwner = viewerID === ownerID;
    const [settings, isFriend, blocked] = await Promise.all([
      this.getSettings(ownerID),
      viewerID && !isOwner ? RelationshipService.areFriends(viewerID, ownerID) : false,
      viewerID && !isOwner ? RelationshipService.hasActiveBlock(viewerID, ownerID) : false,
    ]);
    const context = { viewerID, ownerID, isFriend: Boolean(isFriend), blocked: Boolean(blocked) };
    return {
      canView: canViewScrapbook(settings.viewPermission, context),
      canWrite: canWriteScrapbook(settings.writePermission, context),
      isOwner,
      isFriend: Boolean(isFriend),
      blocked: Boolean(blocked),
    };
  }

  static async assertCanView(ownerID: string, viewerID: string | null) {
    const state = await this.getViewerState(ownerID, viewerID);
    if (!state.canView) throw graphQLError("Você não pode visualizar estes scraps.", "FORBIDDEN");
    return state;
  }

  static async assertCanWrite(ownerID: string, viewerID: string) {
    const state = await this.getViewerState(ownerID, viewerID);
    if (viewerID === ownerID) throw graphQLError("Você não pode deixar um scrap para si mesmo.", "BAD_USER_INPUT");
    if (state.blocked) throw graphQLError("Não é possível enviar scraps enquanto existe um bloqueio.", "FORBIDDEN");
    if (!state.canWrite) throw graphQLError("A privacidade deste mural não permite o envio do scrap.", "FORBIDDEN");
    return state;
  }

  static assertCanEdit(scrap: any, viewerID: string) {
    if (!canEditScrap(viewerID, scrap.authorUserID)) {
      throw graphQLError("Somente o autor pode editar este scrap.", "FORBIDDEN");
    }
  }

  static async assertCanDelete(scrap: any, viewerID: string) {
    const actor = await UserModel.findById(viewerID).select("accountType").lean();
    if (!canDeleteScrap(viewerID, scrap.authorUserID, scrap.recipientUserID, actor?.accountType === "admin")) {
      throw graphQLError("Você não pode excluir este scrap.", "FORBIDDEN");
    }
  }

  static async assertCanReply(original: any, viewerID: string, recipientID: string) {
    if (String(original.recipientUserID) !== viewerID || String(original.authorUserID) !== recipientID) {
      throw graphQLError("Somente o destinatário pode responder ao autor deste scrap.", "FORBIDDEN");
    }
    await this.assertCanWrite(recipientID, viewerID);
  }

  static async hydrate(scraps: any[], viewerID: string | null) {
    if (!scraps.length) return [];
    const scrapIDs = scraps.map((scrap) => scrap._id);
    const authorIDs = [...new Set(scraps.map((scrap) => String(scrap.authorUserID)))];
    const [links, authors, actor] = await Promise.all([
      ScrapMediaModel.find({ scrapID: { $in: scrapIDs } }).sort({ position: 1 }).lean(),
      UserModel.find({ _id: { $in: authorIDs } }).lean(),
      viewerID ? UserModel.findById(viewerID).select("accountType").lean() : null,
    ]);
    const media = await MediaModel.find({
      _id: { $in: links.map((link) => link.mediaID) },
      status: "READY",
      deletedAt: null,
    }).lean();
    const authorMap = new Map(authors.map((author) => [String(author._id), author]));
    const mediaMap = new Map(media.map((item) => [String(item._id), serializeMedia(item)]));
    const linksByScrap = new Map<string, any[]>();
    for (const link of links) {
      const key = String(link.scrapID);
      linksByScrap.set(key, [...(linksByScrap.get(key) ?? []), link]);
    }

    return Promise.all(scraps.map(async (scrap) => {
      const authorID = String(scrap.authorUserID);
      const recipientID = String(scrap.recipientUserID);
      let viewerCanReply = false;
      if (viewerID === recipientID && !scrap.deletedAt) {
        const state = await this.getViewerState(authorID, viewerID);
        viewerCanReply = state.canWrite;
      }
      return {
        ...scrap,
        id: String(scrap._id),
        author: authorMap.get(authorID),
        recipientUserID: recipientID,
        replyToScrapID: scrap.replyToScrapID ? String(scrap.replyToScrapID) : null,
        media: (linksByScrap.get(String(scrap._id)) ?? [])
          .map((link) => mediaMap.get(String(link.mediaID)))
          .filter(Boolean),
        viewerCanEdit: !scrap.deletedAt && canEditScrap(viewerID, scrap.authorUserID),
        viewerCanDelete: !scrap.deletedAt && canDeleteScrap(
          viewerID,
          scrap.authorUserID,
          scrap.recipientUserID,
          actor?.accountType === "admin",
        ),
        viewerCanReply,
      };
    }));
  }

  static async listScraps(input: unknown, viewerID: string | null) {
    const parsed = pageSchema.parse(input);
    const viewerState = await this.getViewerState(parsed.userID, viewerID);
    if (!viewerState.canView) {
      return { edges: [], pageInfo: { hasNextPage: false, endCursor: null }, totalCount: 0, viewerState };
    }
    const filter: Record<string, any> = { recipientUserID: parsed.userID, deletedAt: null };
    if (parsed.after) {
      const cursor = decodeCursor(parsed.after);
      filter.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }
    const [rows, totalCount] = await Promise.all([
      ScrapModel.find(filter).sort({ createdAt: -1, _id: -1 }).limit(parsed.first + 1).lean(),
      ScrapModel.countDocuments({ recipientUserID: parsed.userID, deletedAt: null }),
    ]);
    const hasNextPage = rows.length > parsed.first;
    const pageRows = rows.slice(0, parsed.first);
    const nodes = await this.hydrate(pageRows, viewerID);
    return {
      edges: nodes.map((node, index) => ({ node, cursor: encodeCursor(pageRows[index]) })),
      pageInfo: { hasNextPage, endCursor: pageRows.length ? encodeCursor(pageRows.at(-1)) : null },
      totalCount,
      viewerState,
    };
  }

  static async assertRateLimit(authorID: string, isFriend: boolean) {
    const since = new Date(Date.now() - (isFriend ? 10 * 60_000 : 60 * 60_000));
    const [recent, total] = await Promise.all([
      ScrapModel.countDocuments({ authorUserID: authorID, createdAt: { $gte: since } }),
      ScrapModel.countDocuments({ authorUserID: authorID, deletedAt: null }),
    ]);
    const limit = isFriend ? 10 : 3;
    if (recent >= limit) throw graphQLError("Você enviou muitos scraps recentemente. Aguarde antes de tentar novamente.", "FORBIDDEN");
    if (total >= 5000) throw graphQLError("O limite de armazenamento de scraps desta conta foi atingido.", "FORBIDDEN");
  }

  static async createScrap(data: unknown, authorID: string) {
    const parsed = createScrapSchema.parse(data);
    if (parsed.clientMutationID) {
      const previous = await ScrapModel.findOne({ authorUserID: authorID, clientMutationID: parsed.clientMutationID, deletedAt: null }).lean();
      if (previous) return (await this.hydrate([previous], authorID))[0];
    }
    const state = await this.assertCanWrite(parsed.recipientUserID, authorID);
    if (parsed.replyToScrapID) {
      const original = await ScrapModel.findOne({ _id: parsed.replyToScrapID, deletedAt: null }).lean();
      if (!original) throw graphQLError("O scrap respondido não existe mais.", "NOT_FOUND");
      await this.assertCanReply(original, authorID, parsed.recipientUserID);
    }
    await this.assertRateLimit(authorID, state.isFriend);
    await Promise.all(parsed.mediaIDs.map((id) => MediaService.requireAttachable(id, authorID, "SCRAP_IMAGE")));

    const session = await OrkkutDB.startSession();
    let created: any;
    try {
      await session.withTransaction(async () => {
        const [scrap] = await ScrapModel.create([{
          authorUserID: authorID,
          recipientUserID: parsed.recipientUserID,
          content: parsed.content || null,
          replyToScrapID: parsed.replyToScrapID ?? null,
          clientMutationID: parsed.clientMutationID ?? null,
        }], { session });
        if (!scrap) throw new Error("Falha ao criar scrap.");
        created = scrap.toObject();
        for (const [position, mediaID] of parsed.mediaIDs.entries()) {
          await MediaService.attach(mediaID, authorID, "SCRAP_IMAGE", "SCRAP", scrap._id, session);
          await ScrapMediaModel.create([{ scrapID: scrap._id, mediaID, position }], { session });
        }
      });
    } catch (error: any) {
      if (error?.code === 11000 && parsed.clientMutationID) {
        const previous = await ScrapModel.findOne({ authorUserID: authorID, clientMutationID: parsed.clientMutationID, deletedAt: null }).lean();
        if (previous) return (await this.hydrate([previous], authorID))[0];
      }
      throw error;
    } finally {
      await session.endSession();
    }
    const event: ScrapCreatedEvent = { scrapID: String(created._id), authorUserID: authorID, recipientUserID: parsed.recipientUserID };
    scrapEvents.emit("scrap.created", event);
    return (await this.hydrate([created], authorID))[0];
  }

  static async updateScrap(data: unknown, actorID: string) {
    const parsed = updateScrapSchema.parse(data);
    const current = await ScrapModel.findOne({ _id: parsed.scrapID, deletedAt: null }).lean();
    if (!current) throw graphQLError("Scrap não encontrado.", "NOT_FOUND");
    this.assertCanEdit(current, actorID);
    const currentLinks = await ScrapMediaModel.find({ scrapID: current._id }).sort({ position: 1 }).lean();
    const currentMediaIDs = currentLinks.map((link) => String(link.mediaID));
    const nextMediaIDs = parsed.mediaIDs ?? currentMediaIDs;
    const nextContent = parsed.content === undefined ? current.content ?? null : parsed.content || null;
    if (!nextContent && nextMediaIDs.length === 0) {
      throw graphQLError("Escreva um recado ou adicione uma imagem.", "BAD_USER_INPUT");
    }
    const additions = nextMediaIDs.filter((id) => !currentMediaIDs.includes(id));
    const removals = currentMediaIDs.filter((id) => !nextMediaIDs.includes(id));
    await Promise.all(additions.map((id) => MediaService.requireAttachable(id, actorID, "SCRAP_IMAGE")));

    const session = await OrkkutDB.startSession();
    const editedAt = new Date();
    try {
      await session.withTransaction(async () => {
        const result = await ScrapModel.updateOne(
          { _id: current._id, authorUserID: actorID, deletedAt: null, updatedAt: current.updatedAt },
          { $set: { content: nextContent, editedAt, updatedAt: editedAt } },
          { session, timestamps: false },
        );
        if (result.matchedCount !== 1) throw graphQLError("Este scrap foi alterado em outra operação.", "CONFLICT");
        for (const mediaID of additions) {
          await MediaService.attach(mediaID, actorID, "SCRAP_IMAGE", "SCRAP", current._id, session);
        }
        for (const mediaID of removals) {
          await MediaService.orphan(mediaID, "SCRAP", current._id, session);
        }
        if (parsed.mediaIDs !== undefined) {
          await ScrapMediaModel.deleteMany({ scrapID: current._id }).session(session);
          if (nextMediaIDs.length) {
            await ScrapMediaModel.insertMany(
              nextMediaIDs.map((mediaID, position) => ({ scrapID: current._id, mediaID, position })),
              { session },
            );
          }
        }
      });
    } finally {
      await session.endSession();
    }
    const updated = await ScrapModel.findById(current._id).lean();
    return (await this.hydrate(updated ? [updated] : [], actorID))[0];
  }

  static async deleteScrap(scrapID: unknown, actorID: string) {
    if (!Types.ObjectId.isValid(String(scrapID))) throw graphQLError("Scrap inválido.", "BAD_USER_INPUT");
    const current = await ScrapModel.findOne({ _id: scrapID, deletedAt: null }).lean();
    if (!current) throw graphQLError("Scrap não encontrado.", "NOT_FOUND");
    await this.assertCanDelete(current, actorID);
    const links = await ScrapMediaModel.find({ scrapID: current._id }).lean();
    const session = await OrkkutDB.startSession();
    const deletedAt = new Date();
    try {
      await session.withTransaction(async () => {
        const result = await ScrapModel.updateOne(
          { _id: current._id, deletedAt: null },
          { $set: { deletedAt, deletedByUserID: actorID, updatedAt: deletedAt } },
          { session, timestamps: false },
        );
        if (result.matchedCount !== 1) throw graphQLError("Este scrap já foi excluído.", "CONFLICT");
        for (const link of links) await MediaService.orphan(link.mediaID, "SCRAP", current._id, session);
        await ScrapMediaModel.deleteMany({ scrapID: current._id }).session(session);
      });
    } finally {
      await session.endSession();
    }
    return { deletedScrapID: String(current._id), deletedAt: deletedAt.toISOString() };
  }

  static async updateSettings(userID: string, data: unknown) {
    const parsed = settingsSchema.parse(data);
    const settings = await ScrapbookSettingsModel.findOneAndUpdate(
      { userID },
      { $set: parsed, $setOnInsert: { userID } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    return { ...settings, id: String(settings!._id) };
  }
}

export { DEFAULT_SETTINGS, decodeCursor, encodeCursor };
export default ScrapService;
