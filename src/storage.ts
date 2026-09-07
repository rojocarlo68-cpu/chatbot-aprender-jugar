import type { ApiSettings, RpgConfig, Screen, UiMessage } from "./types";
import { DEFAULT_API, DEFAULT_RPG } from "./types";

/** Bumped keys so old aprender/jugar dual-mode data is ignored. */
const KEYS = {
  api: "caj_api_settings_v3",
  rpg: "caj_rpg_config_v3",
  chat: "caj_chat_rpg_v3",
  screen: "caj_screen_v3",
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
  const loaded = readJson(KEYS.api, DEFAULT_API);
  // Migrate from v2 key if present and v3 empty
  if (!loaded.apiKey) {
    try {
      const legacy = localStorage.getItem("caj_api_settings_v2");
      if (legacy) {
        const parsed = JSON.parse(legacy) as Partial<ApiSettings>;
        return {
          apiKey: parsed.apiKey ?? "",
          baseUrl: parsed.baseUrl || DEFAULT_API.baseUrl,
          model: parsed.model || DEFAULT_API.model,
        };
      }
    } catch {
      /* ignore */
    }
  }
  return {
    apiKey: loaded.apiKey ?? "",
    baseUrl: loaded.baseUrl || DEFAULT_API.baseUrl,
    model: loaded.model || DEFAULT_API.model,
  };
}

export function saveApiSettings(settings: ApiSettings): void {
  writeJson(KEYS.api, settings);
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
