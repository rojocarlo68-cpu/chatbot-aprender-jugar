export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  /** Default text; image bubbles from Generar imagen. */
  kind?: "text" | "image";
  /** In-memory display URL (data URL). Persisted in IndexedDB, not localStorage. */
  imageUrl?: string;
}

export interface ApiSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Vision-capable model used when a reference image is set. */
  visionModel: string;
}

export interface RpgConfig {
  titulo: string;
  personajes: string;
  historia: string;
  personajePrincipal: string;
  /** Prompt continuo: la IA lo consulta en cada turno; editable durante el juego. */
  promptContinuo: string;
}

export type Screen = "config" | "juego";

export const DEFAULT_VISION_MODEL = "qwen/qwen3.6-27b";

export const DEFAULT_API: ApiSettings = {
  apiKey: "",
  baseUrl: "https://api.groq.com/openai/v1",
  model: "openai/gpt-oss-20b",
  visionModel: DEFAULT_VISION_MODEL,
};

export const DEFAULT_RPG: RpgConfig = {
  titulo: "",
  personajes: "",
  historia: "",
  personajePrincipal: "",
  promptContinuo: "",
};

/** Deprecated Groq free-tier models shut down Aug 16 2026. */
export const DEPRECATED_GROQ_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
]);
