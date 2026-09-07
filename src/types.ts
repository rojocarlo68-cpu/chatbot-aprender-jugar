export type AppMode = "aprender" | "jugar";

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
  historia: string;
  personajes: string;
  modoEscritura: string;
}

/** Live editable game context shown in play mode and injected each turn. */
export type RpgLiveContext = string;

export interface KnowledgeStore {
  facts: string[];
  updatedAt: number;
}

export const DEFAULT_API: ApiSettings = {
  apiKey: "",
  baseUrl: "https://api.groq.com/openai/v1",
  model: "llama-3.3-70b-versatile",
};

export const DEFAULT_RPG: RpgConfig = {
  historia: "",
  personajes: "",
  modoEscritura: "",
};

export const DEFAULT_RPG_LIVE_CONTEXT: RpgLiveContext = "";

export const DEFAULT_KNOWLEDGE: KnowledgeStore = {
  facts: [],
  updatedAt: 0,
};
