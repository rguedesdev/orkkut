"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { TopicSummary } from "@/types/topic";
import api from "@/utils/api";
import { Comments } from "../Comments/page";
import Kon from "../../../public/kon.jpg";
import styles from "./topic.module.css";
import { ImageUploadField } from "../ImageUploadField/page";
import type { Media } from "@/types/media";

type TopicProps = {
  topic: TopicSummary;
  communitySlug: string;
  setTopic: (topic: TopicSummary) => void;
  canInteract: boolean;
};

function Topic({ topic, communitySlug, setTopic, canInteract }: TopicProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(topic.title);
  const [editContent, setEditContent] = useState(topic.content);
  const [editImage, setEditImage] = useState<Media | null>(topic.featuredImage ?? null);
  const [imageUploading, setImageUploading] = useState(false);

  const request = async (query: string, variables: object) => {
    const token = localStorage.getItem("token");
    const response = await api.post(
      "/graphql",
      { query, variables },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (response.data.errors?.length) {
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data;
  };

  const toggleLike = async () => {
    setIsMutating(true);
    setError(null);
    try {
      const data = await request(
        `
          mutation SetTopicLike($topicID: ID!, $liked: Boolean!) {
            setTopicLike(topicID: $topicID, liked: $liked) {
              id
              likesCount
              likedByMe
            }
          }
        `,
        { topicID: topic.id, liked: !topic.likedByMe },
      );
      setTopic({ ...topic, ...data.setTopicLike });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao curtir tópico.");
    } finally {
      setIsMutating(false);
    }
  };

  const deleteTopic = async () => {
    if (!window.confirm("Excluir este tópico e todos os comentários?")) return;

    setIsMutating(true);
    try {
      await request(
        `mutation DeleteTopic($id: ID!) { deleteTopic(id: $id) }`,
        { id: topic.id },
      );
      router.replace(`/community/${encodeURIComponent(communitySlug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir tópico.");
      setIsMutating(false);
    }
  };

  const saveTopic = async () => {
    if (isMutating || imageUploading) return;
    setIsMutating(true);
    setError(null);
    try {
      const data = await request(
        `
          mutation UpdateTopic($id: ID!, $data: UpdateTopicInput!) {
            updateTopic(id: $id, data: $data) {
              id title content commentsCount likesCount likedByMe canDelete canEdit
              featuredImageID
              featuredImage { id url originalName mimeType size width height purpose status }
              createdAt updatedAt author { id name username }
            }
          }
        `,
        {
          id: topic.id,
          data: {
            title: editTitle.trim(),
            content: editContent.trim(),
            featuredImageID: editImage?.id ?? null,
          },
        },
      );
      setTopic({ ...topic, ...data.updateTopic });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar tópico.");
    } finally {
      setIsMutating(false);
    }
  };

  const cancelEditing = () => {
    setEditTitle(topic.title);
    setEditContent(topic.content);
    setEditImage(topic.featuredImage ?? null);
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className={styles.topicCard}>
      <article className={styles.topicHeader}>
        {isEditing ? (
          <div className={styles.editForm}>
            <label>
              Título
              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                minLength={3}
                maxLength={120}
                required
              />
            </label>
            <label>
              Conteúdo
              <textarea
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                minLength={1}
                maxLength={5000}
                rows={10}
                required
              />
            </label>
            <ImageUploadField
              label="Imagem de destaque"
              purpose="TOPIC_FEATURED"
              value={editImage}
              onChange={setEditImage}
              onUploadingChange={setImageUploading}
              hint="JPG, PNG ou WebP, até 10 MB."
              disabled={isMutating}
            />
            <div className={styles.actions}>
              <button type="button" onClick={cancelEditing} disabled={isMutating}>Cancelar</button>
              <button
                type="button"
                onClick={saveTopic}
                disabled={isMutating || imageUploading || !editTitle.trim() || !editContent.trim()}
              >
                {isMutating ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </div>
        ) : (
          <h1>{topic.title}</h1>
        )}
        <div className={styles.author}>
          <Image
            className={styles.authorPicture}
            src={Kon}
            alt={`Foto de ${topic.author.name}`}
            width={48}
            height={48}
          />
          <div>
            <span>Criado por</span>
            <Link href={`/user/${encodeURIComponent(topic.author.username)}`}>
              {topic.author.name} · @{topic.author.username}
            </Link>
          </div>
        </div>
        {!isEditing && topic.featuredImage && (
          <div className={styles.featuredImage}>
            <Image
              src={topic.featuredImage.url}
              alt={`Imagem de destaque de ${topic.title}`}
              fill
              unoptimized
            />
          </div>
        )}
        {!isEditing && <p className={styles.content}>{topic.content}</p>}
        <div className={styles.actions}>
          {canInteract && (
            <button disabled={isMutating} onClick={toggleLike}>
              {topic.likedByMe ? "Descurtir" : "Curtir"} ({topic.likesCount})
            </button>
          )}
          {topic.canDelete && (
            <button disabled={isMutating} onClick={deleteTopic}>
              Excluir tópico
            </button>
          )}
          {topic.canEdit && !isEditing && (
            <button disabled={isMutating} onClick={() => setIsEditing(true)}>
              Editar tópico
            </button>
          )}
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </article>

      <div className={styles.commentsSection}>
        <Comments topicID={topic.id} canInteract={canInteract} />
      </div>
    </div>
  );
}

export { Topic };
