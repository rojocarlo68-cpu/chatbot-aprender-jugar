import type { ApiSettings, ChatMessage } from "./types";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function chatCompletion(
  settings: ApiSettings,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  if (!settings.apiKey.trim()) {
    throw new ApiError(
      "Falta la clave de API. Ábrela en Configuración y pégala ahí (solo se guarda en tu navegador).",
    );
  }

  const base = settings.baseUrl.replace(/\/+$/, "");
  const url = base + "/chat/completions";

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + settings.apiKey.trim(),
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ApiError("No se pudo conectar con la API: " + msg);
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(
      "Respuesta inválida de la API (HTTP " + res.status + "): " + text.slice(0, 200),
      res.status,
    );
  }

  const obj = data as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    const errMsg = obj.error?.message || text.slice(0, 300);
    throw new ApiError("Error de API (HTTP " + res.status + "): " + errMsg, res.status);
  }

  const content = obj.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new ApiError("La API no devolvió contenido de mensaje.");
  }
  return content;
}
