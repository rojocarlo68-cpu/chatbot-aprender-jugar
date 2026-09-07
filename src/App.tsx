import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import { ApiError, chatCompletion } from "./api";
import {
  buildAprenderSystemPrompt,
  buildJugarSystemPrompt,
  FACT_EXTRACTION_SYSTEM,
  parseExtractedFacts,
} from "./prompts";
import {
  addFacts,
  clearChat,
  clearKnowledge,
  loadApiSettings,
  loadChat,
  loadKnowledge,
  loadMode,
  loadRpgConfig,
  loadRpgLiveContext,
  saveApiSettings,
  saveChat,
  saveMode,
  saveRpgConfig,
  saveRpgLiveContext,
} from "./storage";
import type {
  ApiSettings,
  AppMode,
  ChatMessage,
  KnowledgeStore,
  RpgConfig,
  RpgLiveContext,
  UiMessage,
} from "./types";

function uid(): string {
  return crypto.randomUUID();
}

export default function App() {
  const [mode, setMode] = useState<AppMode>(() => loadMode());
  const [messages, setMessages] = useState<UiMessage[]>(() => loadChat(loadMode()));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLiveContext, setShowLiveContext] = useState(true);

  const [api, setApi] = useState<ApiSettings>(() => loadApiSettings());
  const [rpg, setRpg] = useState<RpgConfig>(() => loadRpgConfig());
  const [liveContext, setLiveContext] = useState<RpgLiveContext>(() =>
    loadRpgLiveContext(),
  );
  const [knowledge, setKnowledge] = useState<KnowledgeStore>(() => loadKnowledge());

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    saveMode(mode);
    setMessages(loadChat(mode));
    setError(null);
    setInput("");
  }, [mode]);

  useEffect(() => {
    saveChat(mode, messages);
  }, [mode, messages]);

  const hasKey = Boolean(api.apiKey.trim());

  const modeLabel = mode === "aprender" ? "Aprender" : "Jugar";

  const subtitle = useMemo(() => {
    if (mode === "aprender") {
      const n = knowledge.facts.length;
      return n === 0
        ? "Niño curioso listo para aprender"
        : "Recuerda " + n + " dato" + (n === 1 ? "" : "s");
    }
    return rpg.historia.trim()
      ? "Rol con historia configurada"
      : "Configura la historia en Ajustes";
  }, [mode, knowledge.facts.length, rpg.historia]);

  function switchMode(next: AppMode) {
    if (next === mode) return;
    setMode(next);
  }

  function persistApi(next: ApiSettings) {
    setApi(next);
    saveApiSettings(next);
  }

  function persistRpg(next: RpgConfig) {
    setRpg(next);
    saveRpgConfig(next);
  }

  function persistLiveContext(next: RpgLiveContext) {
    setLiveContext(next);
    saveRpgLiveContext(next);
  }

  async function extractAndStoreFacts(userText: string, assistantText: string) {
    try {
      const raw = await chatCompletion(
        api,
        [
          { role: "system", content: FACT_EXTRACTION_SYSTEM },
          {
            role: "user",
            content:
              "Mensaje del usuario:\n" +
              userText +
              "\n\nRespuesta del niño (contexto):\n" +
              assistantText.slice(0, 1500),
          },
        ],
        { temperature: 0, maxTokens: 400 },
      );
      const facts = parseExtractedFacts(raw);
      if (facts.length > 0) {
        const updated = addFacts(facts);
        setKnowledge({ ...updated });
      }
    } catch {
      // El aprendizaje es opcional; no molestar si falla
    }
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

    const systemPrompt =
      mode === "aprender"
        ? buildAprenderSystemPrompt(knowledge)
        : buildJugarSystemPrompt(rpg, liveContext);

    const history: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...nextMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    try {
      const reply = await chatCompletion(api, history, {
        temperature: mode === "jugar" ? 0.85 : 0.7,
        maxTokens: 2048,
      });

      const assistantMsg: UiMessage = {
        id: uid(),
        role: "assistant",
        content: reply,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (mode === "aprender") {
        void extractAndStoreFacts(text, reply);
      }
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
    if (!confirm("¿Borrar el chat de este modo?")) return;
    clearChat(mode);
    setMessages([]);
    setError(null);
  }

  function handleClearKnowledge() {
    if (!confirm("¿Olvidar todo lo aprendido? La personalidad base se mantiene.")) return;
    setKnowledge(clearKnowledge());
  }

  return (
    <div className={"app mode-" + mode}>
      <header className="header">
        <div className="mode-toggle" role="tablist" aria-label="Modo">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "aprender"}
            className={mode === "aprender" ? "active-aprender" : ""}
            onClick={() => switchMode("aprender")}
          >
            Aprender
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "jugar"}
            className={mode === "jugar" ? "active-jugar" : ""}
            onClick={() => switchMode("jugar")}
          >
            Jugar
          </button>
        </div>
        <h1>
          {modeLabel}{" "}
          <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.85rem" }}>
            · {subtitle}
          </span>
        </h1>
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
                {mode === "aprender" ? (
                  <>
                    ¡Hola! Soy un niño curioso. Cuéntame cosas y las iré
                    aprendiendo. Habla conmigo en español.
                  </>
                ) : (
                  <>
                    Modo juego de rol. Configura la historia, personajes y estilo
                    en Ajustes, luego escribe tu primera acción. Puedes editar el
                    contexto vivo debajo mientras juegas.
                  </>
                )}
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={"bubble " + m.role}>
                <span className="meta">
                  {m.role === "user" ? "Tú" : mode === "aprender" ? "Niño" : "Narrador"}
                </span>
                {m.content}
              </div>
            ))}
            {loading && <div className="typing">Escribiendo…</div>}
            <div ref={bottomRef} />
          </div>

          {error && <div className="error-banner">{error}</div>}

          {mode === "jugar" && !showSettings && (
            <div className={"live-context" + (showLiveContext ? " open" : "")}>
              <button
                type="button"
                className="live-context-toggle"
                onClick={() => setShowLiveContext((v) => !v)}
                aria-expanded={showLiveContext}
              >
                <span>Contexto del juego</span>
                <span className="live-context-chevron" aria-hidden="true">
                  {showLiveContext ? "▾" : "▸"}
                </span>
              </button>
              {showLiveContext && (
                <div className="live-context-body">
                  <p className="live-context-hint">
                    La IA consulta este texto en cada turno para seguir la historia.
                  </p>
                  <textarea
                    id="liveContext"
                    className="live-context-textarea"
                    maxLength={200000}
                    value={liveContext}
                    onChange={(e) => persistLiveContext(e.target.value)}
                    placeholder="Estado actual, ubicaciones, objetos, relaciones, hechos en curso…"
                    rows={5}
                  />
                  <small className="live-context-count">
                    {liveContext.length.toLocaleString("es")} caracteres
                  </small>
                </div>
              )}
            </div>
          )}

          <form className="composer" onSubmit={handleSend}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "aprender"
                  ? "Escribe un mensaje…"
                  : "Describe tu acción o diálogo…"
              }
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

        {showSettings && (
          <aside className="panel">
            <h2>Configuración</h2>

            <h3>API (OpenRouter / compatible OpenAI)</h3>
            <div className="field">
              <label htmlFor="apiKey">Clave de API (solo en tu navegador)</label>
              <input
                id="apiKey"
                type="password"
                autoComplete="off"
                value={api.apiKey}
                onChange={(e) => persistApi({ ...api, apiKey: e.target.value })}
                placeholder="sk-or-…"
              />
            </div>
            <div className="field">
              <label htmlFor="baseUrl">URL base</label>
              <input
                id="baseUrl"
                type="url"
                value={api.baseUrl}
                onChange={(e) => persistApi({ ...api, baseUrl: e.target.value })}
                placeholder="https://openrouter.ai/api/v1"
              />
            </div>
            <div className="field">
              <label htmlFor="model">Modelo</label>
              <input
                id="model"
                type="text"
                value={api.model}
                onChange={(e) => persistApi({ ...api, model: e.target.value })}
                placeholder="sao10k/l3.3-euryale-70b"
              />
              <small style={{ color: "var(--text-muted)" }}>
                Puedes cambiar el modelo en{" "}
                <a
                  href="https://openrouter.ai/models"
                  target="_blank"
                  rel="noreferrer"
                >
                  openrouter.ai/models
                </a>{" "}
                (elige is_moderated false si quieres menos filtros). Alternativa:{" "}
                <code>cognitivecomputations/dolphin-mistral-24b-venice-edition</code>
              </small>
            </div>

            {mode === "jugar" && (
              <>
                <h3>Modo Jugar — RPG</h3>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Cada campo admite hasta más de 50.000 caracteres. Se guardan en
                  localStorage. El contexto vivo también se edita mientras chateas.
                </p>
                <div className="field">
                  <label htmlFor="historia">Historia / prompt del juego</label>
                  <textarea
                    id="historia"
                    className="huge"
                    maxLength={200000}
                    value={rpg.historia}
                    onChange={(e) => persistRpg({ ...rpg, historia: e.target.value })}
                    placeholder="Mundo, trama, reglas del juego…"
                  />
                  <small style={{ color: "var(--text-muted)" }}>
                    {rpg.historia.length.toLocaleString("es")} caracteres
                  </small>
                </div>
                <div className="field">
                  <label htmlFor="personajes">Personajes</label>
                  <textarea
                    id="personajes"
                    className="huge"
                    maxLength={200000}
                    value={rpg.personajes}
                    onChange={(e) =>
                      persistRpg({ ...rpg, personajes: e.target.value })
                    }
                    placeholder="Nombre, personalidad, relaciones…"
                  />
                  <small style={{ color: "var(--text-muted)" }}>
                    {rpg.personajes.length.toLocaleString("es")} caracteres
                  </small>
                </div>
                <div className="field">
                  <label htmlFor="modoEscritura">Modo de escritura (estilo)</label>
                  <textarea
                    id="modoEscritura"
                    className="huge"
                    maxLength={200000}
                    value={rpg.modoEscritura}
                    onChange={(e) =>
                      persistRpg({ ...rpg, modoEscritura: e.target.value })
                    }
                    placeholder="Tono, longitud, POV, formato de escenas…"
                  />
                  <small style={{ color: "var(--text-muted)" }}>
                    {rpg.modoEscritura.length.toLocaleString("es")} caracteres
                  </small>
                </div>
                <div className="field">
                  <label htmlFor="liveContextSettings">Contexto del juego (vivo)</label>
                  <textarea
                    id="liveContextSettings"
                    className="huge"
                    maxLength={200000}
                    value={liveContext}
                    onChange={(e) => persistLiveContext(e.target.value)}
                    placeholder="Estado actual que la IA consulta en cada turno…"
                  />
                  <small style={{ color: "var(--text-muted)" }}>
                    {liveContext.length.toLocaleString("es")} caracteres · también
                    editable desde el chat
                  </small>
                </div>
              </>
            )}

            {mode === "aprender" && (
              <>
                <h3>Conocimiento aprendido</h3>
                {knowledge.facts.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Aún no ha aprendido datos duraderos. Conversemos.
                  </p>
                ) : (
                  <ol className="facts-list">
                    {knowledge.facts.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ol>
                )}
                <div className="panel-actions">
                  <button type="button" className="icon-btn danger" onClick={handleClearKnowledge}>
                    Olvidar lo aprendido
                  </button>
                </div>
              </>
            )}

            <h3>Chat</h3>
            <div className="panel-actions">
              <button type="button" className="icon-btn danger" onClick={handleClearChat}>
                Borrar chat de {modeLabel}
              </button>
            </div>

            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Todo se guarda solo en tu navegador (localStorage). No hay servidor
              propio ni secretos en el código.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
