import type {
  ApiSettings,
  AppMode,
  KnowledgeStore,
  RpgConfig,
  UiMessage,
} from "./types";
import {
  DEFAULT_API,
  DEFAULT_KNOWLEDGE,
  DEFAULT_RPG,
} from "./types";

const KEYS = {
  api: "caj_api_settings",
  rpg: "caj_rpg_config",
  knowledge: "caj_knowledge",
  mode: "caj_mode",
  chatAprender: "caj_chat_aprender",
  chatJugar: "caj_chat_jugar",
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadApiSettings(): ApiSettings {
  return readJson(KEYS.api, DEFAULT_API);
}

export function saveApiSettings(settings: ApiSettings): void {
  writeJson(KEYS.api, settings);
}

export function loadRpgConfig(): RpgConfig {
  return readJson(KEYS.rpg, DEFAULT_RPG);
}

export function saveRpgConfig(config: RpgConfig): void {
  writeJson(KEYS.rpg, config);
}

export function loadKnowledge(): KnowledgeStore {
  const data = readJson(KEYS.knowledge, DEFAULT_KNOWLEDGE);
  if (!Array.isArray(data.facts)) data.facts = [];
  return data;
}

export function saveKnowledge(store: KnowledgeStore): void {
  writeJson(KEYS.knowledge, store);
}

export function addFacts(newFacts: string[]): KnowledgeStore {
  const store = loadKnowledge();
  const existing = new Set(store.facts.map((f) => f.trim().toLowerCase()));
  for (const fact of newFacts) {
    const trimmed = fact.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (existing.has(key)) continue;
    existing.add(key);
    store.facts.push(trimmed);
  }
  store.updatedAt = Date.now();
  saveKnowledge(store);
  return store;
}

export function clearKnowledge(): KnowledgeStore {
  const empty = { ...DEFAULT_KNOWLEDGE, updatedAt: Date.now() };
  saveKnowledge(empty);
  return empty;
}

export function loadMode(): AppMode {
  const m = localStorage.getItem(KEYS.mode);
  return m === "jugar" ? "jugar" : "aprender";
}

export function saveMode(mode: AppMode): void {
  localStorage.setItem(KEYS.mode, mode);
}

export function loadChat(mode: AppMode): UiMessage[] {
  const key = mode === "aprender" ? KEYS.chatAprender : KEYS.chatJugar;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChat(mode: AppMode, messages: UiMessage[]): void {
  const key = mode === "aprender" ? KEYS.chatAprender : KEYS.chatJugar;
  writeJson(key, messages);
}

export function clearChat(mode: AppMode): void {
  saveChat(mode, []);
}
