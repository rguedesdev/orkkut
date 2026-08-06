import path from "node:path";
import sharp from "sharp";

import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_LIMITS,
  type MediaPurpose,
} from "../config/media.js";

type ProcessedImage = {
  body: Buffer;
  mimeType: "image/webp";
  size: number;
  width: number;
  height: number;
};

type ImageStorage = {
  uploadFile(key: string, body: Buffer, contentType: string): Promise<void>;
};

const FORMAT_TO_MIME = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

const sanitizeOriginalName = (name: string) =>
  path.basename(name).replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "image";

const validateUploadDeclaration = (
  filename: string,
  mimeType: string,
  size: number,
  purpose: MediaPurpose,
) => {
  const extension = path.extname(filename).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    throw new Error("Extensão não permitida. Use JPG, PNG ou WebP.");
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as any)) {
    throw new Error("Tipo de arquivo não permitido. Use JPG, PNG ou WebP.");
  }
  if (size > IMAGE_LIMITS[purpose].maxBytes) {
    throw new Error(`A imagem excede o limite de ${IMAGE_LIMITS[purpose].maxBytes / 1024 / 1024} MB.`);
  }
};

const processImage = async (
  source: Buffer,
  declaredMimeType: string,
  purpose: MediaPurpose,
): Promise<ProcessedImage> => {
  const input = sharp(source, { failOn: "warning", limitInputPixels: 64_000_000 });
  const metadata = await input.metadata();
  const actualMime = metadata.format
    ? FORMAT_TO_MIME[metadata.format as keyof typeof FORMAT_TO_MIME]
    : undefined;

  if (!actualMime || actualMime !== declaredMimeType) {
    throw new Error("O conteúdo real do arquivo não corresponde ao tipo informado.");
  }
  if (!metadata.width || !metadata.height) {
    throw new Error("Não foi possível identificar as dimensões da imagem.");
  }

  const limit = IMAGE_LIMITS[purpose];
  if (metadata.width > limit.maxWidth || metadata.height > limit.maxHeight) {
    throw new Error(`A imagem excede as dimensões máximas de ${limit.maxWidth}×${limit.maxHeight}px.`);
  }

  const body = await input
    .rotate()
    .resize({
      width:
        purpose === "COMMUNITY_AVATAR" || purpose === "USER_AVATAR" ? 1200 : 2400,
      height:
        purpose === "COMMUNITY_AVATAR" || purpose === "USER_AVATAR" ? 1200 : 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 84 })
    .toBuffer();
  const output = await sharp(body).metadata();

  return {
    body,
    mimeType: "image/webp",
    size: body.length,
    width: output.width!,
    height: output.height!,
  };
};

const persistProcessedImage = async (
  storage: ImageStorage,
  key: string,
  image: ProcessedImage,
) => {
  await storage.uploadFile(key, image.body, image.mimeType);
};

export {
  persistProcessedImage,
  processImage,
  sanitizeOriginalName,
  validateUploadDeclaration,
};
export type { ProcessedImage };
