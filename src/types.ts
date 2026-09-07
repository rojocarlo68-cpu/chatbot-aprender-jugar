export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export interface ApiSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
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

export const DEFAULT_API: ApiSettings = {
  apiKey: "",
  baseUrl: "https://openrouter.ai/api/v1",
  model: "sao10k/l3.3-euryale-70b",
};

export const DEFAULT_RPG: RpgConfig = {
  titulo: "",
  personajes: "",
  historia: "",
  personajePrincipal: "",
  promptContinuo: "",
};
