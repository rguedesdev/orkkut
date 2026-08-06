import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

type StoredFile = {
  body: Buffer;
  contentType: string;
};

interface StorageProvider {
  uploadFile(key: string, body: Buffer, contentType: string): Promise<void>;
  deleteFile(key: string): Promise<void>;
  getFile(key: string): Promise<StoredFile>;
  getPublicUrl(key: string): string;
}

const safeStorageKey = (key: string) => {
  if (!/^[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/.test(key) || key.includes("..")) {
    throw new Error("Chave de armazenamento inválida.");
  }
  return key;
};

class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor() {
    if (process.env.NODE_ENV === "production") {
      throw new Error("O driver de armazenamento local não é permitido em produção.");
    }
    this.root = path.resolve(process.env.STORAGE_LOCAL_DIR ?? ".uploads");
  }

  private resolve(key: string) {
    const target = path.resolve(this.root, safeStorageKey(key));
    if (!target.startsWith(`${this.root}${path.sep}`)) {
      throw new Error("Caminho de armazenamento inválido.");
    }
    return target;
  }

  async uploadFile(key: string, body: Buffer) {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body, { flag: "wx" });
  }

  async deleteFile(key: string) {
    try {
      await unlink(this.resolve(key));
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  async getFile(key: string) {
    return { body: await readFile(this.resolve(key)), contentType: "image/webp" };
  }

  getPublicUrl(key: string) {
    const base = process.env.STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
    return `${base}/${safeStorageKey(key).split("/").map(encodeURIComponent).join("/")}`;
  }
}

class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.STORAGE_BUCKET ?? "";
    if (!this.bucket) throw new Error("STORAGE_BUCKET é obrigatória para o driver S3.");

    const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
    const config: ConstructorParameters<typeof S3Client>[0] = {
      region: process.env.STORAGE_REGION ?? "auto",
      forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
    };
    if (process.env.STORAGE_ENDPOINT) config.endpoint = process.env.STORAGE_ENDPOINT;
    if (accessKeyId && secretAccessKey) {
      config.credentials = { accessKeyId, secretAccessKey };
    }
    this.client = new S3Client(config);
  }

  async uploadFile(key: string, body: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: safeStorageKey(key),
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  async deleteFile(key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: safeStorageKey(key) }),
    );
  }

  async getFile(key: string) {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: safeStorageKey(key) }),
    );
    if (!result.Body) throw new Error("Arquivo não encontrado no armazenamento.");
    return {
      body: Buffer.from(await result.Body.transformToByteArray()),
      contentType: result.ContentType ?? "application/octet-stream",
    };
  }

  getPublicUrl(key: string) {
    const base = process.env.STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, "");
    if (!base) throw new Error("STORAGE_PUBLIC_BASE_URL é obrigatória para o driver S3.");
    return `${base}/${safeStorageKey(key).split("/").map(encodeURIComponent).join("/")}`;
  }
}

let provider: StorageProvider | null = null;

const getStorageProvider = () => {
  if (!provider) {
    provider =
      (process.env.STORAGE_DRIVER ?? "local") === "s3"
        ? new S3StorageProvider()
        : new LocalStorageProvider();
  }
  return provider;
};

const StorageService = {
  uploadFile: (key: string, body: Buffer, contentType: string) =>
    getStorageProvider().uploadFile(key, body, contentType),
  deleteFile: (key: string) => getStorageProvider().deleteFile(key),
  getFile: (key: string) => getStorageProvider().getFile(key),
  getPublicUrl: (key: string) => getStorageProvider().getPublicUrl(key),
};

export { StorageService, safeStorageKey };
export type { StorageProvider, StoredFile };
