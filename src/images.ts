/** Client-side image compress + Pollinations generation. */

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.75;

export async function compressImageFile(
  file: File,
  maxEdge = MAX_EDGE,
  quality = JPEG_QUALITY,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear el canvas.");
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
}

/** Compress a blob/object URL result to a JPEG data URL for IndexedDB. */
export async function compressBlobToDataUrl(
  blob: Blob,
  maxEdge = MAX_EDGE,
  quality = JPEG_QUALITY,
): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  try {
    const { width, height } = bitmap;
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear el canvas.");
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
}

export function buildPollinationsUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt.trim());
  return (
    "https://image.pollinations.ai/prompt/" +
    encoded +
    "?width=1024&height=1024&nologo=true"
  );
}

export function buildPollinationsUrlPathOnly(prompt: string): string {
  return (
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt.trim())
  );
}

/**
 * Fetch a generated image from Pollinations (CORS *).
 * Tries query-param URL first; falls back to path-only if needed.
 */
export async function generatePollinationsImage(
  prompt: string,
): Promise<Blob> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error("El prompt de imagen está vacío.");
  }

  const urls = [buildPollinationsUrl(trimmed), buildPollinationsUrlPathOnly(trimmed)];
  let lastErr: unknown;

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "GET", mode: "cors" });
      if (!res.ok) {
        lastErr = new Error("HTTP " + res.status);
        continue;
      }
      const blob = await res.blob();
      if (!blob.type.startsWith("image/") && blob.size < 1000) {
        lastErr = new Error("La respuesta no parece una imagen.");
        continue;
      }
      return blob;
    } catch (err) {
      lastErr = err;
    }
  }

  const detail =
    lastErr instanceof Error ? lastErr.message : String(lastErr ?? "desconocido");
  throw new Error(
    "No se pudo generar la imagen con Pollinations (" + detail + ").",
  );
}
