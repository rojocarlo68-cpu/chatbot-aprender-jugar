import type { ApiSettings, ChatMessage } from "./types";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function formatErr(err: unknown): string {
  if (err instanceof Error) {
    const name = err.name || "Error";
    const msg = (err.message || "").trim();
    return msg ? name + ": " + msg : name;
  }
  return String(err);
}

function isNetworkish(err: unknown): boolean {
  const s = formatErr(err).toLowerCase();
  return (
    s.includes("failed to fetch") ||
    s.includes("load failed") ||
    s.includes("networkerror") ||
    s.includes("network request failed") ||
    s.includes("fetch failed") ||
    /^typeerror:?\s*$/i.test(formatErr(err).trim()) ||
    (err instanceof TypeError && !(err.message || "").trim())
  );
}

function assertAbsoluteHttpsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    throw new ApiError(
      "La URL base está vacía. Usa https://api.groq.com/openai/v1 (Groq) u otra URL https absoluta.",
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ApiError(
      "La URL base no es válida. Debe ser una URL absoluta https, por ejemplo https://api.groq.com/openai/v1",
    );
  }
  if (parsed.protocol !== "https:") {
    throw new ApiError(
      "La URL base debe usar https:// (recibido: " +
        parsed.protocol +
        "). Ejemplo: https://api.groq.com/openai/v1",
    );
  }
  return trimmed.replace(/\/+$/, "");
}

export async function chatCompletion(
  settings: ApiSettings,
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    /** Override model for this request (e.g. vision model when reference image is set). */
    model?: string;
  },
): Promise<string> {
  const apiKey = settings.apiKey.trim();
  if (!apiKey) {
    throw new ApiError(
      "Falta la clave de API. Ábrela en Ajustes y pégala ahí (solo se guarda en tu navegador).",
    );
  }

  const base = assertAbsoluteHttpsUrl(settings.baseUrl);
  const url = base + "/chat/completions";
  const model = (options?.model ?? settings.model).trim();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + apiKey,
  };

  // OpenRouter recommends these; omit for other providers (e.g. Groq).
  if (base.toLowerCase().includes("openrouter.ai")) {
    headers["HTTP-Referer"] =
      "https://rojocarlo68-cpu.github.io/chatbot-aprender-jugar/";
    headers["X-Title"] = "RPG Chat — Aprender Jugar";
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.85,
        max_tokens: options?.maxTokens ?? 2048,
      }),
    });
  } catch (err) {
    const detail = formatErr(err);
    if (isNetworkish(err)) {
      throw new ApiError(
        "No se pudo conectar con la API (" +
          detail +
          "). Revisa: 1) que la URL base sea https absoluta (p. ej. https://api.groq.com/openai/v1), 2) tu conexión a internet, 3) bloqueadores/adblock, y 4) que el modelo sea un id actual de Groq (p. ej. openai/gpt-oss-20b; llama-3.3-70b-versatile ya no está en capa gratuita).",
      );
    }
    throw new ApiError("No se pudo conectar con la API: " + detail);
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(
      "Respuesta inválida de la API (HTTP " +
        res.status +
        "): " +
        text.slice(0, 200),
      res.status,
    );
  }

  const obj = data as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    const errMsg = obj.error?.message || text.slice(0, 300);
    throw new ApiError(
      "Error de API (HTTP " + res.status + "): " + errMsg,
      res.status,
    );
  }

  const content = obj.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new ApiError("La API no devolvió contenido de mensaje.");
  }
  return content;
}

/** Quick connectivity check: 1-token hello. */
export async function testApiConnection(
  settings: ApiSettings,
): Promise<string> {
  return chatCompletion(
    settings,
    [{ role: "user", content: "Di solo: ok" }],
    { temperature: 0, maxTokens: 8 },
  );
}
