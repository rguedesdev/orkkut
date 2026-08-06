"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { ImageUploadField } from "@/components/ImageUploadField/page";
import type { Community } from "@/types/community";
import type { Media } from "@/types/media";
import api from "@/utils/api";
import styles from "./communityeditform.module.css";

type Props = {
  community: Community;
  onSaved: (community: Community) => void;
  onClose: () => void;
};

function CommunityEditForm({ community, onSaved, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [category, setCategory] = useState(community.category);
  const [privacy, setPrivacy] = useState(community.privacy);
  const [country, setCountry] = useState(community.country);
  const [language, setLanguage] = useState(community.language);
  const [avatarImage, setAvatarImage] = useState<Media | null>(community.avatarImage ?? null);
  const [coverImage, setCoverImage] = useState<Media | null>(community.coverImage ?? null);
  const [uploads, setUploads] = useState({ avatar: false, cover: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || uploads.avatar || uploads.cover) return;
    setSaving(true);
    setError(null);
    try {
      const response = await api.post(
        "/graphql",
        {
          query: `
            mutation UpdateCommunity($id: ID!, $data: UpdateCommunityInput!) {
              updateCommunity(id: $id, data: $data) {
                id ownerID name slug description category privacy country language
                members createdAt updatedAt canEdit avatarImageID coverImageID
                avatarImage { id url originalName mimeType size width height purpose status }
                coverImage { id url originalName mimeType size width height purpose status }
                membersList { role user { id name username } }
              }
            }
          `,
          variables: {
            id: community.id,
            data: {
              name: name.trim(),
              description: description.trim(),
              category,
              privacy,
              country,
              language,
              avatarImageID: avatarImage?.id ?? null,
              coverImageID: coverImage?.id ?? null,
            },
          },
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      const updated = response.data.data.updateCommunity as Community;
      onSaved(updated);
      onClose();
      if (updated.slug !== community.slug) {
        router.replace(`/community/${encodeURIComponent(updated.slug)}`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao editar comunidade.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.header}>
        <h2>Editar comunidade</h2>
        <button type="button" onClick={onClose}>Fechar</button>
      </div>

      <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} minLength={5} maxLength={120} required /></label>
      <label>Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={5000} required /></label>
      <div className={styles.grid}>
        <label>Categoria<input value={category} onChange={(e) => setCategory(e.target.value)} required /></label>
        <label>Privacidade<input value={privacy} onChange={(e) => setPrivacy(e.target.value)} required /></label>
        <label>País<input value={country} onChange={(e) => setCountry(e.target.value)} required /></label>
        <label>Idioma<input value={language} onChange={(e) => setLanguage(e.target.value)} required /></label>
      </div>

      <ImageUploadField
        label="Avatar da comunidade"
        purpose="COMMUNITY_AVATAR"
        value={avatarImage}
        onChange={setAvatarImage}
        onUploadingChange={(avatar) => setUploads((state) => ({ ...state, avatar }))}
        hint="Até 5 MB. Recomendado: imagem quadrada."
        disabled={saving}
      />
      <ImageUploadField
        label="Capa da comunidade"
        purpose="COMMUNITY_COVER"
        value={coverImage}
        onChange={setCoverImage}
        onUploadingChange={(cover) => setUploads((state) => ({ ...state, cover }))}
        hint="Até 10 MB. Recomendado: formato panorâmico."
        disabled={saving}
      />

      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.save} type="submit" disabled={saving || uploads.avatar || uploads.cover}>
        {saving ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}

export { CommunityEditForm };
