import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import { ApiError, chatCompletion } from "./api";
import { buildRpgSystemPrompt } from "./prompts";
import {
  clearChat,
  loadApiSettings,
  loadChat,
  loadRpgConfig,
  loadScreen,
  resetRpgConfig,
  saveApiSettings,
  saveChat,
  saveRpgConfig,
  saveScreen,
} from "./storage";
import type {
  ApiSettings,
  ChatMessage,
  RpgConfig,
  Screen,
  UiMessage,
} from "./types";

function uid(): string {
  return crypto.randomUUID();
}

function canStartGame(rpg: RpgConfig): boolean {
  return (
    rpg.titulo.trim().length > 0 &&
    rpg.historia.trim().length > 0 &&
    rpg.personajePrincipal.trim().length > 0
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => loadScreen());
  const [messages, setMessages] = useState<UiMessage[]>(() => loadChat());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPromptContinuo, setShowPromptContinuo] = useState(true);
  const [configHint, setConfigHint] = useState<string | null>(null);

  const [api, setApi] = useState<ApiSettings>(() => loadApiSettings());
  const [rpg, setRpg] = useState<RpgConfig>(() => loadRpgConfig());

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    saveScreen(screen);
  }, [screen]);

  useEffect(() => {
    saveChat(messages);
  }, [messages]);

  const hasKey = Boolean(api.apiKey.trim());
  const titleDisplay = rpg.titulo.trim() || "Juego de rol";

  function persistApi(next: ApiSettings) {
    setApi(next);
    saveApiSettings(next);
  }

  function persistRpg(next: RpgConfig) {
    setRpg(next);
    saveRpgConfig(next);
  }

  function goToJuego() {
    if (!canStartGame(rpg)) {
      setConfigHint(
        "Completa al menos Título, Historia y Personaje principal para jugar.",
      );
      return;
    }
    setConfigHint(null);
    setError(null);
    setScreen("juego");
    setShowSettings(false);
  }

  function goToConfig() {
    setError(null);
    setScreen("config");
    setShowSettings(false);
  }

  async function handleSend(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");

    const userMsg: UiMessage = {
      id: uid(),
      role: "user",
      content: text,
      ts: Date.now(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    // Re-read latest rpg from state (includes promptContinuo edited mid-play)
    const systemPrompt = buildRpgSystemPrompt(rpg);
    const history: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...nextMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    try {
      const reply = await chatCompletion(api, history, {
        temperature: 0.85,
        maxTokens: 2048,
      });

      const assistantMsg: UiMessage = {
        id: uid(),
        role: "assistant",
        content: reply,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Error desconocido";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleClearChat() {
    if (!confirm("¿Borrar el chat del juego? La configuración se mantiene."))
      return;
    clearChat();
    setMessages([]);
    setError(null);
  }

  function handleResetConfig() {
    if (
      !confirm(
        "¿Restablecer toda la configuración del juego? El chat no se borra.",
      )
    )
      return;
    const empty = resetRpgConfig();
    setRpg(empty);
    setConfigHint(null);
  }

  function renderSettings() {
    return (
      <aside className="panel">
        <h2>Ajustes</h2>

        <h3>API (Groq por defecto)</h3>
        <div className="field">
          <label htmlFor="apiKey">Clave de API (solo en tu navegador)</label>
          <input
            id="apiKey"
            type="password"
            autoComplete="off"
            value={api.apiKey}
            onChange={(e) => persistApi({ ...api, apiKey: e.target.value })}
            placeholder="gsk_…"
          />
          <small style={{ color: "var(--text-muted)" }}>
            Clave gratis en{" "}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
            >
              console.groq.com/keys
            </a>
            .
          </small>
        </div>
        <div className="field">
          <label htmlFor="baseUrl">URL base</label>
          <input
            id="baseUrl"
            type="url"
            value={api.baseUrl}
            onChange={(e) => persistApi({ ...api, baseUrl: e.target.value })}
            placeholder="https://api.groq.com/openai/v1"
          />
        </div>
        <div className="field">
          <label htmlFor="model">Modelo</label>
          <input
            id="model"
            type="text"
            value={api.model}
            onChange={(e) => persistApi({ ...api, model: e.target.value })}
            placeholder="llama-3.3-70b-versatile"
          />
          <small style={{ color: "var(--text-muted)" }}>
            Por defecto (Groq gratis):{" "}
            <code>llama-3.3-70b-versatile</code>. Opcional: OpenRouter (
            <code>https://openrouter.ai/api/v1</code> + euryale/dolphin)
            requiere créditos.
          </small>
        </div>

        <h3>Datos</h3>
        <div className="panel-actions">
          <button
            type="button"
            className="icon-btn danger"
            onClick={handleClearChat}
          >
            Borrar chat
          </button>
          <button
            type="button"
            className="icon-btn danger"
            onClick={handleResetConfig}
          >
            Restablecer configuración
          </button>
        </div>

        <p
          style={{
            margin: "0.5rem 0 0",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          Todo se guarda solo en tu navegador (localStorage). No hay servidor
          propio ni secretos en el código.
        </p>
      </aside>
    );
  }

  function renderConfigScreen() {
    const ready = canStartGame(rpg);
    return (
      <div className="config-screen">
        <div className="config-card">
          <header className="config-header">
            <div>
              <h1>Configuración del juego</h1>
              <p className="config-sub">
                Define el mundo, los personajes y el prompt continuo. Luego pulsa
                Jugar.
              </p>
            </div>
            <div className="config-header-actions">
              <span
                className={"status-dot" + (hasKey ? " on" : "")}
                title={hasKey ? "Clave de API guardada" : "Sin clave de API"}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowSettings((v) => !v)}
              >
                {showSettings ? "Cerrar ajustes" : "Ajustes / API"}
              </button>
            </div>
          </header>

          <div className="config-body">
            <div className="config-form">
              <div className="field">
                <label htmlFor="titulo">Título del juego de rol</label>
                <input
                  id="titulo"
                  type="text"
                  value={rpg.titulo}
                  onChange={(e) =>
                    persistRpg({ ...rpg, titulo: e.target.value })
                  }
                  placeholder="Ej. Las sombras de Valdris"
                  maxLength={500}
                />
              </div>

              <div className="field">
                <label htmlFor="personajePrincipal">Personaje principal</label>
                <textarea
                  id="personajePrincipal"
                  className="huge"
                  maxLength={200000}
                  value={rpg.personajePrincipal}
                  onChange={(e) =>
                    persistRpg({
                      ...rpg,
                      personajePrincipal: e.target.value,
                    })
                  }
                  placeholder="Quién eres: nombre, aspecto, habilidades, trasfondo…"
                  rows={4}
                />
                <small style={{ color: "var(--text-muted)" }}>
                  {rpg.personajePrincipal.length.toLocaleString("es")} caracteres
                </small>
              </div>

              <div className="field">
                <label htmlFor="personajes">
                  Personajes (descripción física y personalidades)
                </label>
                <textarea
                  id="personajes"
                  className="huge"
                  maxLength={200000}
                  value={rpg.personajes}
                  onChange={(e) =>
                    persistRpg({ ...rpg, personajes: e.target.value })
                  }
                  placeholder="NPCs y aliados: apariencia, personalidad, relaciones…"
                  rows={6}
                />
                <small style={{ color: "var(--text-muted)" }}>
                  {rpg.personajes.length.toLocaleString("es")} caracteres
                </small>
              </div>

              <div className="field">
                <label htmlFor="historia">Historia</label>
                <textarea
                  id="historia"
                  className="huge"
                  maxLength={200000}
                  value={rpg.historia}
                  onChange={(e) =>
                    persistRpg({ ...rpg, historia: e.target.value })
                  }
                  placeholder="Mundo, trama, reglas, tono…"
                  rows={8}
                />
                <small style={{ color: "var(--text-muted)" }}>
                  {rpg.historia.length.toLocaleString("es")} caracteres
                </small>
              </div>

              <div className="field">
                <label htmlFor="promptContinuo">Prompt continuo</label>
                <p className="field-hint">
                  Texto que la IA debe consultar en cada turno. Puedes editarlo
                  también durante el juego.
                </p>
                <textarea
                  id="promptContinuo"
                  className="huge"
                  maxLength={200000}
                  value={rpg.promptContinuo}
                  onChange={(e) =>
                    persistRpg({ ...rpg, promptContinuo: e.target.value })
                  }
                  placeholder="Estado actual, ubicaciones, objetos, relaciones, hechos en curso…"
                  rows={5}
                />
                <small style={{ color: "var(--text-muted)" }}>
                  {rpg.promptContinuo.length.toLocaleString("es")} caracteres
                </small>
              </div>

              {(configHint || !ready) && (
                <p className="config-hint">
                  {configHint ||
                    "Completa Título, Historia y Personaje principal para habilitar Jugar."}
                </p>
              )}

              <div className="config-cta">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!ready}
                  onClick={goToJuego}
                >
                  Jugar
                </button>
                {!hasKey && (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setShowSettings(true)}
                  >
                    Configurar API
                  </button>
                )}
              </div>
            </div>

            {showSettings && renderSettings()}
          </div>
        </div>
      </div>
    );
  }

  function renderJuegoScreen() {
    return (
      <>
        <header className="header">
          <button
            type="button"
            className="icon-btn"
            onClick={goToConfig}
            title="Volver a configuración (el chat se conserva)"
          >
            ← Config
          </button>
          <h1 title={titleDisplay}>{titleDisplay}</h1>
          <span
            className={"status-dot" + (hasKey ? " on" : "")}
            title={hasKey ? "Clave de API guardada" : "Sin clave de API"}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowSettings((v) => !v)}
          >
            {showSettings ? "Chat" : "Ajustes"}
          </button>
        </header>

        <div className="main">
          <section className="chat-area">
            <div className="messages">
              {messages.length === 0 && (
                <div className="empty-hint">
                  Escribe tu primera acción o diálogo. El narrador usará el
                  título, la historia, los personajes y el prompt continuo.
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={"bubble " + m.role}>
                  <span className="meta">
                    {m.role === "user" ? "Tú" : "Narrador"}
                  </span>
                  {m.content}
                </div>
              ))}
              {loading && <div className="typing">Escribiendo…</div>}
              <div ref={bottomRef} />
            </div>

            {error && <div className="error-banner">{error}</div>}

            {!showSettings && (
              <div
                className={
                  "live-context" + (showPromptContinuo ? " open" : "")
                }
              >
                <button
                  type="button"
                  className="live-context-toggle"
                  onClick={() => setShowPromptContinuo((v) => !v)}
                  aria-expanded={showPromptContinuo}
                >
                  <span>Prompt continuo</span>
                  <span className="live-context-chevron" aria-hidden="true">
                    {showPromptContinuo ? "▾" : "▸"}
                  </span>
                </button>
                {showPromptContinuo && (
                  <div className="live-context-body">
                    <p className="live-context-hint">
                      La IA consulta este texto en cada turno. Edítalo cuando
                      cambie el estado del juego.
                    </p>
                    <textarea
                      id="livePromptContinuo"
                      className="live-context-textarea"
                      maxLength={200000}
                      value={rpg.promptContinuo}
                      onChange={(e) =>
                        persistRpg({
                          ...rpg,
                          promptContinuo: e.target.value,
                        })
                      }
                      placeholder="Estado actual, ubicaciones, objetos, relaciones…"
                      rows={5}
                    />
                    <small className="live-context-count">
                      {rpg.promptContinuo.length.toLocaleString("es")} caracteres
                    </small>
                  </div>
                )}
              </div>
            )}

            <form className="composer" onSubmit={handleSend}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe tu acción o diálogo…"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={loading}
              />
              <button
                type="submit"
                className="send"
                disabled={loading || !input.trim()}
              >
                Enviar
              </button>
            </form>
          </section>

          {showSettings && renderSettings()}
        </div>
      </>
    );
  }

  return (
    <div className={"app screen-" + screen}>
      {screen === "config" ? renderConfigScreen() : renderJuegoScreen()}
    </div>
  );
}

