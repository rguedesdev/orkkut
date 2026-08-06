"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Kon from "../../../public/kon.jpg";
import type { Media } from "@/types/media";
import type { Scrap, ScrapConnection } from "@/types/scrap";
import api from "@/utils/api";
import styles from "./scraps.module.css";

const scrapFormSchema = z.object({
  content: z.string().trim().max(2000, "Use no máximo 2000 caracteres."),
});
type ScrapFormData = z.infer<typeof scrapFormSchema>;

const scrapSelection = `
  id recipientUserID content replyToScrapID createdAt updatedAt editedAt
  viewerCanEdit viewerCanDelete viewerCanReply
  author { id name username profile { avatarImage { id url } } }
  media { id url originalName mimeType size width height purpose status }
`;

const removeTemporaryMedia = async (mediaID: string) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch(`${api.defaults.baseURL ?? ""}/uploads/images/${mediaID}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      keepalive: true,
    });
  } catch (error) {
    console.error("Não foi possível remover o upload temporário.", error);
  }
};

function ScrapsComponent({
  userID,
  username,
  name,
  onCountChange,
}: {
  userID: string;
  username: string;
  name: string;
  onCountChange?: (count: number) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replyToScrapID = searchParams.get("replyToScrap");
  const [connection, setConnection] = useState<ScrapConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draftMedia, setDraftMedia] = useState<Media[]>([]);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingMedia, setEditingMedia] = useState<Media[]>([]);
  const [galleryURL, setGalleryURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const temporaryIDs = useRef(new Set<string>());
  const clientMutationIDRef = useRef<string | null>(null);
  const clientMutationPayloadRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ScrapFormData>({
    resolver: zodResolver(scrapFormSchema),
    defaultValues: { content: "" },
  });
  const content = watch("content");

  useEffect(() => {
    if (connection) onCountChange?.(connection.totalCount);
  }, [connection, onCountChange]);

  useEffect(() => () => {
    for (const id of temporaryIDs.current) void removeTemporaryMedia(id);
  }, []);

  const load = useCallback(async (after?: string | null) => {
    const response = await api.post("/graphql", {
      query: `query UserScraps($userID: ID!, $first: Int!, $after: String) {
        userScraps(userID: $userID, first: $first, after: $after) {
          totalCount viewerState { canView canWrite isOwner isFriend }
          pageInfo { hasNextPage endCursor }
          edges { cursor node { ${scrapSelection} } }
        }
      }`,
      variables: { userID, first: 10, after: after ?? null },
    });
    if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
    const next = response.data.data.userScraps as ScrapConnection;
    setConnection((current) => after && current ? {
      ...next,
      edges: [...current.edges, ...next.edges],
    } : next);
  }, [userID]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os scraps.");
    }).finally(() => setLoading(false));
  }, [load]);

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>, editing: boolean) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    const current = editing ? editingMedia : draftMedia;
    if (!files.length || uploading) return;
    if (current.length + files.length > 4) {
      setError("Use no máximo 4 imagens por scrap.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    const uploaded: Media[] = [];
    try {
      for (const [index, file] of files.entries()) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use imagens JPG, PNG ou WebP.");
        if (file.size > 10 * 1024 * 1024) throw new Error("Cada imagem deve ter no máximo 10 MB.");
        const form = new FormData();
        form.append("file", file);
        const response = await api.post("/uploads/images?purpose=SCRAP_IMAGE", form, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          onUploadProgress: (progress) => {
            const currentFile = progress.total ? progress.loaded / progress.total : 0;
            setUploadProgress(Math.round(((index + currentFile) / files.length) * 100));
          },
        });
        const media = response.data.media as Media;
        temporaryIDs.current.add(media.id);
        uploaded.push(media);
        if (editing) setEditingMedia((items) => [...items, media]);
        else setDraftMedia((items) => [...items, media]);
      }
    } catch (uploadError: unknown) {
      const requestError = uploadError as { response?: { data?: { error?: string } }; message?: string };
      setError(requestError.response?.data?.error ?? requestError.message ?? "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      setUploadProgress(uploaded.length ? 100 : 0);
    }
  };

  const removeMedia = (media: Media, editing: boolean) => {
    if (temporaryIDs.current.has(media.id)) {
      temporaryIDs.current.delete(media.id);
      void removeTemporaryMedia(media.id);
    }
    if (editing) setEditingMedia((items) => items.filter((item) => item.id !== media.id));
    else setDraftMedia((items) => items.filter((item) => item.id !== media.id));
  };

  const create = handleSubmit(async ({ content: nextContent }) => {
    if (submitting || uploading || (!nextContent.trim() && !draftMedia.length)) {
      if (!nextContent.trim() && !draftMedia.length) setError("Escreva um recado ou adicione uma imagem.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payloadFingerprint = JSON.stringify({
        content: nextContent.trim(),
        mediaIDs: draftMedia.map((media) => media.id),
        replyToScrapID,
      });
      if (clientMutationPayloadRef.current !== payloadFingerprint) {
        clientMutationIDRef.current = crypto.randomUUID();
        clientMutationPayloadRef.current = payloadFingerprint;
      }
      const response = await api.post("/graphql", {
        query: `mutation CreateScrap($input: CreateScrapInput!) { createScrap(input: $input) { ${scrapSelection} } }`,
        variables: { input: {
          recipientUserID: userID,
          content: nextContent.trim() || null,
          mediaIDs: draftMedia.map((media) => media.id),
          replyToScrapID: replyToScrapID || null,
          clientMutationID: clientMutationIDRef.current,
        } },
      });
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      const created = response.data.data.createScrap as Scrap;
      for (const media of draftMedia) temporaryIDs.current.delete(media.id);
      setConnection((current) => current ? {
        ...current,
        totalCount: current.totalCount + 1,
        edges: [{ node: created, cursor: "" }, ...current.edges],
      } : current);
      setDraftMedia([]);
      reset({ content: "" });
      clientMutationIDRef.current = null;
      clientMutationPayloadRef.current = null;
      if (replyToScrapID) router.replace(`/user/${encodeURIComponent(username)}/scraps`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Não foi possível enviar o scrap.");
    } finally {
      setSubmitting(false);
    }
  });

  const beginEdit = (scrap: Scrap) => {
    for (const media of editingMedia) {
      if (temporaryIDs.current.has(media.id)) {
        temporaryIDs.current.delete(media.id);
        void removeTemporaryMedia(media.id);
      }
    }
    setEditingID(scrap.id);
    setEditingContent(scrap.content ?? "");
    setEditingMedia(scrap.media);
    setError(null);
  };

  const cancelEdit = () => {
    for (const media of editingMedia) {
      if (temporaryIDs.current.has(media.id)) {
        temporaryIDs.current.delete(media.id);
        void removeTemporaryMedia(media.id);
      }
    }
    setEditingID(null);
    setEditingMedia([]);
  };

  const saveEdit = async () => {
    if (!editingID || submitting || uploading || (!editingContent.trim() && !editingMedia.length)) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.post("/graphql", {
        query: `mutation UpdateScrap($input: UpdateScrapInput!) { updateScrap(input: $input) { ${scrapSelection} } }`,
        variables: { input: { scrapID: editingID, content: editingContent.trim() || null, mediaIDs: editingMedia.map((media) => media.id) } },
      });
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      const updated = response.data.data.updateScrap as Scrap;
      for (const media of editingMedia) temporaryIDs.current.delete(media.id);
      setConnection((current) => current ? {
        ...current,
        edges: current.edges.map((edge) => edge.node.id === updated.id ? { ...edge, node: updated } : edge),
      } : current);
      setEditingID(null);
      setEditingMedia([]);
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : "Não foi possível editar o scrap.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteScrap = async (scrapID: string) => {
    if (submitting || !window.confirm("Excluir este scrap?")) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.post("/graphql", {
        query: `mutation DeleteScrap($scrapID: ID!) { deleteScrap(scrapID: $scrapID) { deletedScrapID } }`,
        variables: { scrapID },
      });
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      setConnection((current) => current ? {
        ...current,
        totalCount: Math.max(0, current.totalCount - 1),
        edges: current.edges.filter((edge) => edge.node.id !== scrapID),
      } : current);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Não foi possível excluir o scrap.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadMore = async () => {
    if (!connection?.pageInfo.endCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    await load(connection.pageInfo.endCursor).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar mais scraps.");
    }).finally(() => setLoadingMore(false));
  };

  if (loading) return <section className={styles.container}><p role="status">Carregando scraps…</p></section>;
  if (!connection) return <section className={styles.container}><p role="alert">{error ?? "Não foi possível carregar os scraps."}</p></section>;

  return (
    <section className={styles.container} aria-labelledby="scraps-title">
      <header><h2 id="scraps-title">Scraps ({connection.totalCount})</h2></header>
      {!connection.viewerState.canView ? <p>Os scraps deste perfil são privados.</p> : (
        <>
          {connection.viewerState.canWrite && (
            <form className={styles.composer} onSubmit={create}>
              {replyToScrapID && <p className={styles.replyNotice}>Respondendo com um novo scrap no mural de {name}.</p>}
              <label htmlFor={`scrap-${userID}`}>Deixe um scrap para {name}</label>
              <textarea id={`scrap-${userID}`} rows={4} maxLength={2000} {...register("content")} />
              <span className={styles.counter}>{content.length}/2000</span>
              {errors.content && <small>{errors.content.message}</small>}
              <MediaPreviews media={draftMedia} onRemove={(media) => removeMedia(media, false)} onOpen={setGalleryURL} />
              {uploading && <progress value={uploadProgress} max={100} aria-label={`Upload ${uploadProgress}%`} />}
              <div className={styles.actions}>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || draftMedia.length >= 4}>Adicionar imagens</button>
                <button type="submit" disabled={submitting || uploading}>{submitting ? "Enviando…" : "Enviar scrap"}</button>
              </div>
              <input ref={fileInputRef} className={styles.fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadFiles(event, false)} />
            </form>
          )}

          {!connection.edges.length ? <p className={styles.empty}>Nenhum scrap neste mural.</p> : (
            <ul className={styles.list}>
              {connection.edges.map(({ node: scrap }) => (
                <li key={scrap.id} className={styles.scrap}>
                  <div className={styles.author}>
                    <a className={styles.authorImageLink} href={`/user/${encodeURIComponent(scrap.author.username)}`} aria-label={`Abrir perfil de ${scrap.author.name}`}>
                      <Image src={scrap.author.profile?.avatarImage?.url ?? Kon} alt={`Foto de ${scrap.author.name}`} width={64} height={64} unoptimized={Boolean(scrap.author.profile?.avatarImage?.url)} />
                    </a>
                    <a className={styles.authorNameLink} href={`/user/${encodeURIComponent(scrap.author.username)}`}>
                      <strong>{scrap.author.name}</strong>
                    </a>
                    <span>@{scrap.author.username}</span>
                  </div>
                  <div className={styles.body}>
                    {editingID === scrap.id ? (
                      <div className={styles.editForm}>
                        <textarea rows={4} maxLength={2000} value={editingContent} onChange={(event) => setEditingContent(event.target.value)} />
                        <span className={styles.counter}>{editingContent.length}/2000</span>
                        <MediaPreviews media={editingMedia} onRemove={(media) => removeMedia(media, true)} onOpen={setGalleryURL} />
                        {uploading && <progress value={uploadProgress} max={100} />}
                        <div className={styles.actions}>
                          <button type="button" onClick={() => editFileInputRef.current?.click()} disabled={uploading || editingMedia.length >= 4}>Adicionar imagens</button>
                          <button type="button" onClick={cancelEdit}>Cancelar</button>
                          <button type="button" onClick={saveEdit} disabled={submitting || uploading}>Salvar</button>
                        </div>
                        <input ref={editFileInputRef} className={styles.fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadFiles(event, true)} />
                      </div>
                    ) : (
                      <>
                        {scrap.content && <p className={styles.content}>{scrap.content}</p>}
                        <MediaPreviews media={scrap.media} onOpen={setGalleryURL} />
                        <p className={styles.meta}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(scrap.createdAt))}{scrap.editedAt ? " · editado" : ""}</p>
                        <div className={styles.actions}>
                          {scrap.viewerCanReply && <button type="button" onClick={() => router.push(`/user/${encodeURIComponent(scrap.author.username)}/scraps?replyToScrap=${encodeURIComponent(scrap.id)}`)}>Responder</button>}
                          {scrap.viewerCanEdit && <button type="button" onClick={() => beginEdit(scrap)}>Editar</button>}
                          {scrap.viewerCanDelete && <button type="button" onClick={() => deleteScrap(scrap.id)} disabled={submitting}>Excluir</button>}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {connection.pageInfo.hasNextPage && <button className={styles.loadMore} type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Carregando…" : "Carregar mais"}</button>}
        </>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {galleryURL && <div className={styles.gallery} role="dialog" aria-modal="true" onClick={() => setGalleryURL(null)}><button type="button" aria-label="Fechar galeria">×</button><Image src={galleryURL} alt="Imagem ampliada do scrap" fill unoptimized /></div>}
    </section>
  );
}

function MediaPreviews({ media, onRemove, onOpen }: { media: Media[]; onRemove?: (media: Media) => void; onOpen: (url: string) => void }) {
  if (!media.length) return null;
  return <div className={styles.mediaGrid}>{media.map((item) => <figure key={item.id}><button type="button" className={styles.imageButton} onClick={() => onOpen(item.url)}><Image src={item.url} alt={item.originalName || "Imagem do scrap"} fill unoptimized /></button>{onRemove && <button type="button" className={styles.removeImage} onClick={() => onRemove(item)} aria-label="Remover imagem">×</button>}</figure>)}</div>;
}

export { ScrapsComponent };
