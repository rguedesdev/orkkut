"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import type { Media, MediaPurpose } from "@/types/media";
import api from "@/utils/api";
import styles from "./imageuploadfield.module.css";

const PURPOSE_LIMITS: Record<MediaPurpose, number> = {
  COMMUNITY_AVATAR: 5 * 1024 * 1024,
  COMMUNITY_COVER: 10 * 1024 * 1024,
  TOPIC_FEATURED: 10 * 1024 * 1024,
  USER_AVATAR: 5 * 1024 * 1024,
  SCRAP_IMAGE: 10 * 1024 * 1024,
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const deleteTemporaryMedia = async (mediaID: string, tokenOverride?: string) => {
  try {
    const token = tokenOverride ?? localStorage.getItem("token");
    if (!token) return;
    const response = await fetch(`${api.defaults.baseURL ?? ""}/uploads/images/${mediaID}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      keepalive: true,
    });
    if (![204, 404, 409].includes(response.status)) {
      console.error("Não foi possível remover o upload temporário.");
    }
  } catch (deleteError: unknown) {
    console.error("Não foi possível remover o upload temporário.", deleteError);
  }
};

type ImageUploadFieldProps = {
  label: string;
  purpose: MediaPurpose;
  value: Media | null;
  onChange: (media: Media | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  hint?: string;
  disabled?: boolean;
  authToken?: string;
  fallbackUrl?: string;
};

function ImageUploadField({
  label,
  purpose,
  value,
  onChange,
  onUploadingChange,
  hint,
  disabled = false,
  authToken,
  fallbackUrl,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const temporaryMediaIDRef = useRef<string | null>(null);
  const originalValueRef = useRef<Media | null>(value);
  const [preview, setPreview] = useState<string | null>(value?.url ?? null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (!localPreview) setPreview(value?.url ?? null);
  }, [value, localPreview]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (temporaryMediaIDRef.current) {
        void deleteTemporaryMedia(temporaryMediaIDRef.current, authToken);
        temporaryMediaIDRef.current = null;
      }
    };
  }, [authToken]);

  const setUploadState = (next: boolean) => {
    setUploading(next);
    onUploadingChange?.(next);
  };

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploading) return;

    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Use uma imagem JPG, PNG ou WebP.");
      return;
    }

    if (file.size > PURPOSE_LIMITS[purpose]) {
      setError(`A imagem deve ter no máximo ${PURPOSE_LIMITS[purpose] / 1024 / 1024} MB.`);
      return;
    }

    if (temporaryMediaIDRef.current) {
      const previousMediaID = temporaryMediaIDRef.current;
      temporaryMediaIDRef.current = null;
      await deleteTemporaryMedia(previousMediaID, authToken);
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setLocalPreview(objectUrl);
    setPreview(objectUrl);
    setProgress(0);
    setUploadState(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const form = new FormData();
      form.append("file", file);
      const token = authToken ?? localStorage.getItem("token");
      const response = await api.post(`/uploads/images?purpose=${purpose}`, form, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      temporaryMediaIDRef.current = response.data.media.id;
      setChanged(true);
      onChange(response.data.media);
      setPreview(response.data.media.url);
      setProgress(100);
    } catch (uploadError: unknown) {
      const requestError = uploadError as {
        code?: string;
        response?: { data?: { error?: string } };
      };
      if (requestError.code !== "ERR_CANCELED") {
        setError(requestError.response?.data?.error ?? "Não foi possível enviar a imagem.");
      }
      onChange(originalValueRef.current);
      setPreview(originalValueRef.current?.url ?? null);
    } finally {
      abortRef.current = null;
      setUploadState(false);
      URL.revokeObjectURL(objectUrl);
      if (objectUrlRef.current === objectUrl) objectUrlRef.current = null;
      setLocalPreview(null);
    }
  };

  const remove = () => {
    abortRef.current?.abort();
    if (temporaryMediaIDRef.current) {
      void deleteTemporaryMedia(temporaryMediaIDRef.current, authToken);
      temporaryMediaIDRef.current = null;
    }
    onChange(null);
    setPreview(null);
    setChanged(true);
    setProgress(0);
    setError(null);
  };

  const cancelChange = () => {
    abortRef.current?.abort();
    if (temporaryMediaIDRef.current) {
      void deleteTemporaryMedia(temporaryMediaIDRef.current, authToken);
      temporaryMediaIDRef.current = null;
    }
    onChange(originalValueRef.current);
    setPreview(originalValueRef.current?.url ?? null);
    setProgress(0);
    setError(null);
    setChanged(false);
  };

  const displayedPreview = preview ?? fallbackUrl ?? null;

  return (
    <fieldset className={styles.field} disabled={disabled}>
      <legend>{label}</legend>
      {displayedPreview ? (
        <div className={styles.preview}>
          <Image src={displayedPreview} alt={`Pré-visualização de ${label}`} fill unoptimized />
        </div>
      ) : (
        <div className={styles.placeholder}>Nenhuma imagem selecionada</div>
      )}

      {uploading && (
        <div className={styles.progressBlock} aria-live="polite">
          <progress value={progress} max={100} />
          <span>Enviando… {progress}%</span>
        </div>
      )}
      {hint && <small>{hint}</small>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading || disabled}>
          {value || uploading ? "Trocar imagem" : "Selecionar imagem"}
        </button>
        {(value || uploading) && (
          <button type="button" onClick={remove} disabled={disabled}>
            {uploading ? "Cancelar envio" : "Remover imagem"}
          </button>
        )}
        {changed && (
          <button type="button" onClick={cancelChange} disabled={disabled}>
            Cancelar alteração
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        className={styles.fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={selectFile}
      />
    </fieldset>
  );
}

export { ImageUploadField };
