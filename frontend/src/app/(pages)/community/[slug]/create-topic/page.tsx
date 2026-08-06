"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import api from "@/utils/api";
import styles from "./create-topic.module.css";
import { ImageUploadField } from "@/components/ImageUploadField/page";
import type { Media } from "@/types/media";

function CreateTopic() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [communityID, setCommunityID] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<Media | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.post(
          "/graphql",
          {
            query: `
              query CommunityForTopic($slug: String!) {
                community(slug: $slug) {
                  id
                  name
                }
              }
            `,
            variables: { slug },
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data.errors?.length) {
          throw new Error(response.data.errors[0].message);
        }
        setCommunityID(response.data.data.community?.id ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Comunidade não encontrada.");
      }
    };

    fetchCommunity();
  }, [slug]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!communityID || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        "/graphql",
        {
          query: `
            mutation CreateTopic($data: CreateTopicInput!) {
              createTopic(data: $data) {
                id
              }
            }
          `,
          variables: {
            data: {
              communityID,
              title: title.trim(),
              content: content.trim(),
              featuredImageID: featuredImage?.id,
            },
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      router.replace(
        `/community/${encodeURIComponent(slug)}/forum/${response.data.data.createTopic.id}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar tópico.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1>Criar tópico</h1>

        <label htmlFor="title">Título</label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={3}
          maxLength={120}
          required
        />

        <label htmlFor="content">Conteúdo</label>
        <textarea
          id="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          minLength={1}
          maxLength={5000}
          rows={12}
          required
        />

        <ImageUploadField
          label="Imagem de destaque"
          purpose="TOPIC_FEATURED"
          value={featuredImage}
          onChange={setFeaturedImage}
          onUploadingChange={setImageUploading}
          hint="JPG, PNG ou WebP, até 10 MB."
          disabled={isLoading}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" onClick={() => router.back()}>
            Cancelar
          </button>
          <button type="submit" disabled={!communityID || isLoading || imageUploading}>
            {isLoading ? "Criando..." : "Criar tópico"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default CreateTopic;
