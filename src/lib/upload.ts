import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getExtensionFromFileName(fileName?: string) {
  if (!fileName) {
    return null;
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) {
    return null;
  }

  if (extension === "jpeg") {
    return "jpg";
  }

  if (["jpg", "png", "webp", "gif"].includes(extension)) {
    return extension;
  }

  return null;
}

type UploadBlob = Blob & { name?: string };

function getSupabaseUploadConfig() {
  const baseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "products";

  if (!baseUrl || !serviceRoleKey) {
    return null;
  }

  return { baseUrl, serviceRoleKey, bucket };
}

async function saveProductImageToSupabase(
  file: UploadBlob,
  extension: string,
  contentType: string,
): Promise<string> {
  const config = getSupabaseUploadConfig();
  if (!config) {
    throw new Error("Supabase storage config is missing");
  }

  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const objectPath = `products/${fileName}`;
  const uploadUrl = `${config.baseUrl}/storage/v1/object/${config.bucket}/${objectPath}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: Buffer.from(await file.arrayBuffer()),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase storage upload failed: ${details}`);
  }

  return `${config.baseUrl}/storage/v1/object/public/${config.bucket}/${objectPath}`;
}

async function saveProductImageLocally(file: UploadBlob, extension: string) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadsDir, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, fileBuffer);

  return `/uploads/products/${fileName}`;
}

export function isSupportedProductImageFile(file: UploadBlob | null) {
  if (!file || file.size === 0) {
    return true;
  }

  return Boolean(ALLOWED_MIME_TO_EXT[file.type] ?? getExtensionFromFileName(file.name));
}

export async function saveUploadedProductImage(file: UploadBlob | null) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = ALLOWED_MIME_TO_EXT[file.type] ?? getExtensionFromFileName(file.name);
  if (!extension) {
    return null;
  }

  if (getSupabaseUploadConfig()) {
    try {
      return await saveProductImageToSupabase(file, extension, file.type || "application/octet-stream");
    } catch {
      // Keep local fallback so development and partially configured environments still work.
      return saveProductImageLocally(file, extension);
    }
  }

  return saveProductImageLocally(file, extension);
}

export async function saveUploadedProductImages(files: UploadBlob[]) {
  const uploadedUrls = await Promise.all(files.map((file) => saveUploadedProductImage(file)));
  return uploadedUrls.filter((url): url is string => Boolean(url));
}
