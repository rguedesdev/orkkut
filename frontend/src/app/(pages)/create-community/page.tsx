"use client";

// Imports Principais
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Axios
import api from "@/utils/api";

// Style Sheet CSS
import styles from "./createcommunity.module.css";

// Componentes
import { InputComponent } from "@/components/Input/page";
import { SelectComponent } from "@/components/Select/page";
import { ImageUploadField } from "@/components/ImageUploadField/page";
import type { Media } from "@/types/media";

// Schema de validação usando Zod
const CreateCommunitySchema = z.object({
  name: z
    .string()
    .min(5, "Insira pelo menos 5 caracteres!")
    .max(120, "Insira no máximo 120 caracteres!"),
  description: z.string().nonempty("A descrição é obrigatória!"),
  category: z.string().nonempty("Selecione a categoria!"),
  privacy: z.string().nonempty("Selecione o tipo de privacidade!"),
  country: z.string().nonempty("Selecione o país!"),
  language: z.string().nonempty("Selecione o idioma!"),
});

// Tipo para os dados do formulário, inferido a partir do schema
type TCreateCommunityFormData = z.infer<typeof CreateCommunitySchema>;

function CreateCommunity() {
  const [avatarImage, setAvatarImage] = useState<Media | null>(null);
  const [coverImage, setCoverImage] = useState<Media | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const categorias = [
    { value: "anime", label: "Anime" },
    { value: "manga", label: "Mangá" },
    { value: "games", label: "Jogos" },
    { value: "retro", label: "Retro Gaming" },
  ];

  const privacy = [
    { value: "public", label: "Público" },
    { value: "private", label: "Privado" },
    { value: "secret", label: "Secreto" },
  ];

  const countries = [
    { value: "brazil", label: "Brasil" },
    { value: "usa", label: "Estados Unidos" },
  ];

  const languages = [
    { value: "pt-BR", label: "Português" },
    { value: "en", label: "Inglês" },
  ];

  // Configuração do React Hook Form com validação Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TCreateCommunityFormData>({
    resolver: zodResolver(CreateCommunitySchema),
  });

  const handleCreateCommunity = async (data: TCreateCommunityFormData) => {
    const mutation = `
      mutation CreateCommunity($data: CreateCommunityInput!) {
        createCommunity(data: $data) {
          id
          name
          slug
        }
      }
    `;

    try {
      setIsSubmitting(true);
      // Usando a sua instância do Axios (api)
      const response = await api.post("/graphql", {
        query: mutation,
        variables: {
          data: {
            ...data,
            avatarImageID: avatarImage?.id,
            coverImageID: coverImage?.id,
          },
        },
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const { data: gqlData, errors } = response.data;

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      console.log("Comunidade criada com sucesso!", gqlData.createCommunity);

      // Redireciona para a página da comunidade recém-criada
      router.push(`/community/${gqlData.createCommunity.slug}`);
    } catch (err: unknown) {
      console.error("Erro ao criar comunidade:", err);
      alert(err instanceof Error ? err.message : "Erro ao conectar com o servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <h1 className={styles.communityTitle}>Criar Comunidade</h1>
        <form onSubmit={handleSubmit(handleCreateCommunity)} autoComplete="off">
          <InputComponent
            inputLabel="Nome da Comunidade"
            inputType="text"
            inputID="name"
            inputPlaceholder="Digite o nome da Comunidade"
            register={register("name")}
            error={errors.name?.message}
          />

          <div>
            <fieldset
              className={`${errors.description ? `${styles.fieldsetError}` : `${styles.fieldset}`}`}
            >
              <legend className={styles.legend}>Descrição</legend>
              <textarea
                className={styles.textarea}
                placeholder="Descrição da Comunidade"
                {...register("description")}
              />
            </fieldset>
            {errors.description && (
              <span
                className={styles.errorTextarea}
              >{`※ ${errors.description.message}`}</span>
            )}
          </div>

          <div className={styles.selectsContainer}>
            <SelectComponent
              selectLabel="Categoria"
              register={register("category")}
              options={categorias}
              error={errors.category?.message}
            />

            <SelectComponent
              selectLabel="Privacidade"
              register={register("privacy")}
              options={privacy}
              error={errors.privacy?.message}
            />

            <SelectComponent
              selectLabel="País"
              register={register("country")}
              options={countries}
              error={errors.country?.message}
            />

            <SelectComponent
              selectLabel="Idioma"
              register={register("language")}
              options={languages}
              error={errors.language?.message}
            />
          </div>

          <ImageUploadField
            label="Avatar da comunidade"
            purpose="COMMUNITY_AVATAR"
            value={avatarImage}
            onChange={setAvatarImage}
            onUploadingChange={setAvatarUploading}
            hint="JPG, PNG ou WebP, até 5 MB. Recomendado: imagem quadrada."
            disabled={isSubmitting}
          />
          <ImageUploadField
            label="Capa da comunidade"
            purpose="COMMUNITY_COVER"
            value={coverImage}
            onChange={setCoverImage}
            onUploadingChange={setCoverUploading}
            hint="JPG, PNG ou WebP, até 10 MB. Recomendado: formato panorâmico."
            disabled={isSubmitting}
          />

          <button
            className={styles.btnCreate}
            type="submit"
            disabled={avatarUploading || coverUploading || isSubmitting}
          >
            {isSubmitting ? "Criando…" : "Criar Comunidade"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateCommunity;
