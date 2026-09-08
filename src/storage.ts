import type { ApiSettings, RpgConfig, Screen, UiMessage } from "./types";
import {
  DEFAULT_API,
  DEFAULT_RPG,
  DEFAULT_VISION_MODEL,
  DEPRECATED_GROQ_MODELS,
} from "./types";
import { clearAllMessageImages } from "./idb";

/** Bumped keys so old aprender/jugar dual-mode data is ignored. */
const KEYS = {
  /** v6: adds visionModel for reference-image chat. */
  api: "caj_api_settings_v6",
  rpg: "caj_rpg_config_v3",
  chat: "caj_chat_rpg_v3",
  screen: "caj_screen_v3",
} as const;

const LEGACY_API_KEYS = [
  "caj_api_settings_v5",
  "caj_api_settings_v4",
  "caj_api_settings_v3",
  "caj_api_settings_v2",
] as const;

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

function isOpenRouterDefault(settings: Partial<ApiSettings>): boolean {
  const base = (settings.baseUrl ?? "").toLowerCase();
  return base.includes("openrouter.ai") && !(settings.apiKey ?? "").trim();
}

function normalizeApiSettings(parsed: Partial<ApiSettings>): ApiSettings {
  let model = (parsed.model || DEFAULT_API.model).trim();
  if (DEPRECATED_GROQ_MODELS.has(model)) {
    model = DEFAULT_API.model;
  }
  const visionModel =
    (parsed.visionModel || DEFAULT_VISION_MODEL).trim() || DEFAULT_VISION_MODEL;
  return {
    apiKey: (parsed.apiKey ?? "").trim(),
    baseUrl: (parsed.baseUrl || DEFAULT_API.baseUrl).trim() || DEFAULT_API.baseUrl,
    model: model || DEFAULT_API.model,
    visionModel,
  };
}

function migrateFromLegacyApi(): ApiSettings | null {
  for (const legacyKey of LEGACY_API_KEYS) {
    try {
      const legacy = localStorage.getItem(legacyKey);
      if (!legacy) continue;
      const parsed = JSON.parse(legacy) as Partial<ApiSettings>;
      // Old OpenRouter defaults with no key → adopt Groq defaults.
      if (isOpenRouterDefault(parsed)) {
        return { ...DEFAULT_API };
      }
      // User had a real key (or non-default base) → keep their settings (migrate model).
      if ((parsed.apiKey ?? "").trim() || parsed.baseUrl || parsed.model) {
        return normalizeApiSettings(parsed);
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function loadApiSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(KEYS.api);
    if (!raw) {
      const migrated = migrateFromLegacyApi();
      if (migrated) {
        writeJson(KEYS.api, migrated);
        return migrated;
      }
      return { ...DEFAULT_API };
    }
    const loaded = JSON.parse(raw) as Partial<ApiSettings>;
    // Safety: if somehow still on empty-key OpenRouter, force Groq defaults.
    if (isOpenRouterDefault(loaded)) {
      const next = { ...DEFAULT_API };
      writeJson(KEYS.api, next);
      return next;
    }
    const next = normalizeApiSettings(loaded);
    // Persist rewrite if deprecated model was replaced or visionModel added.
    if (
      (loaded.model || "").trim() !== next.model ||
      !(loaded.visionModel || "").trim()
    ) {
      writeJson(KEYS.api, next);
    }
    return next;
  } catch {
    return { ...DEFAULT_API };
  }
}

export function saveApiSettings(settings: ApiSettings): void {
  writeJson(KEYS.api, {
    apiKey: settings.apiKey.trim(),
    baseUrl: settings.baseUrl.trim(),
    model: settings.model.trim(),
    visionModel: (settings.visionModel || DEFAULT_VISION_MODEL).trim(),
  });
}

export function loadRpgConfig(): RpgConfig {
  const loaded = readJson(KEYS.rpg, DEFAULT_RPG);
  return {
    titulo: loaded.titulo ?? "",
    personajes: loaded.personajes ?? "",
    historia: loaded.historia ?? "",
    personajePrincipal: loaded.personajePrincipal ?? "",
    promptContinuo: loaded.promptContinuo ?? "",
  };
}

export function saveRpgConfig(config: RpgConfig): void {
  writeJson(KEYS.rpg, config);
}

export function loadScreen(): Screen {
  const s = localStorage.getItem(KEYS.screen);
  return s === "juego" ? "juego" : "config";
}

export function saveScreen(screen: Screen): void {
  localStorage.setItem(KEYS.screen, screen);
}

/** Persist chat metadata only (no image data URLs — those live in IndexedDB). */
export function loadChat(): UiMessage[] {
  try {
    const raw = localStorage.getItem(KEYS.chat);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((m: UiMessage) => ({
      id: m.id,
      role: m.role,
      content: typeof m.content === "string" ? m.content : "",
      ts: typeof m.ts === "number" ? m.ts : Date.now(),
      kind: m.kind === "image" ? "image" : "text",
      // imageUrl hydrated async from IndexedDB
    }));
  } catch {
    return [];
  }
}

export function saveChat(messages: UiMessage[]): void {
  const slim = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    ts: m.ts,
    kind: m.kind === "image" ? "image" : "text",
  }));
  writeJson(KEYS.chat, slim);
}

export async function clearChat(): Promise<void> {
  saveChat([]);
  await clearAllMessageImages();
}

export function resetRpgConfig(): RpgConfig {
  saveRpgConfig({ ...DEFAULT_RPG });
  return { ...DEFAULT_RPG };
}
