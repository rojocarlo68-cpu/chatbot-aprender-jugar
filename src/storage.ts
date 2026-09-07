import type { ApiSettings, RpgConfig, Screen, UiMessage } from "./types";
import { DEFAULT_API, DEFAULT_RPG, DEPRECATED_GROQ_MODELS } from "./types";

/** Bumped keys so old aprender/jugar dual-mode data is ignored. */
const KEYS = {
  /** v5: Groq free model openai/gpt-oss-20b (llama-3.3 shut down Aug 2026). */
  api: "caj_api_settings_v5",
  rpg: "caj_rpg_config_v3",
  chat: "caj_chat_rpg_v3",
  screen: "caj_screen_v3",
} as const;

const LEGACY_API_KEYS = [
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
  return {
    apiKey: (parsed.apiKey ?? "").trim(),
    baseUrl: (parsed.baseUrl || DEFAULT_API.baseUrl).trim() || DEFAULT_API.baseUrl,
    model: model || DEFAULT_API.model,
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
    // Persist rewrite if deprecated model was replaced (preserve apiKey).
    if ((loaded.model || "").trim() !== next.model) {
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

export function loadChat(): UiMessage[] {
  try {
    const raw = localStorage.getItem(KEYS.chat);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChat(messages: UiMessage[]): void {
  writeJson(KEYS.chat, messages);
}

export function clearChat(): void {
  saveChat([]);
}

export function resetRpgConfig(): RpgConfig {
  saveRpgConfig({ ...DEFAULT_RPG });
  return { ...DEFAULT_RPG };
}
