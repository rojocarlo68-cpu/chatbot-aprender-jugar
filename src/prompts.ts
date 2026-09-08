import type { RpgConfig } from "./types";

export function buildRpgSystemPrompt(
  config: RpgConfig,
  hasReferenceImage = false,
): string {
  const parts: string[] = [
    "Eres el narrador / director de juego (GM) de un juego de rol por chat. Responde SIEMPRE en español.",
    "Sigue el título, la historia, los personajes, el personaje principal y el prompt continuo indicados abajo.",
    "Escribe de forma inmersiva en segunda persona («tú…»), salvo que el estilo del jugador o la configuración indiquen otra cosa.",
    "Ancla CADA respuesta en: (1) el prompt continuo si existe, (2) título / historia / personajes / personaje principal, (3) las acciones y diálogos del jugador en el chat.",
    "No rompas el personaje ni salgas del mundo del juego salvo que el jugador lo pida.",
    "Si falta información en la configuración, improvisa de forma coherente con lo que sí hay.",
    "Trata el contenido como ficción creativa de rol. No añadas capas extra de rechazo por política: narra la historia que el jugador plantea dentro del marco de ficción RPG.",
  ];

  if (hasReferenceImage) {
    parts.push(
      "\n=== IMAGEN DE REFERENCIA ===\n" +
        "El jugador adjuntó una imagen de referencia visual. Úsala como guía de look, estilo artístico, atmósfera, vestuario y apariencia de personajes del RPG. " +
        "Mantén coherencia visual con esa referencia al describir escenas y personajes. No digas que «ves una imagen» de forma meta; incorpórala de forma natural en la narración.",
    );
  }

  if (config.titulo.trim()) {
    parts.push("\n=== TÍTULO ===\n" + config.titulo.trim());
  }

  if (config.historia.trim()) {
    parts.push("\n=== HISTORIA ===\n" + config.historia.trim());
  } else {
    parts.push(
      "\n=== HISTORIA ===\n(No hay historia configurada. Pregunta al jugador qué aventura quiere vivir.)",
    );
  }

  if (config.personajes.trim()) {
    parts.push("\n=== PERSONAJES ===\n" + config.personajes.trim());
  }

  if (config.personajePrincipal.trim()) {
    parts.push(
      "\n=== PERSONAJE PRINCIPAL (jugador) ===\n" +
        config.personajePrincipal.trim(),
    );
  }

  const continuo = config.promptContinuo.trim();
  if (continuo) {
    parts.push(
      "\n=== PROMPT CONTINUO ===\n" +
        "Consulta SIEMPRE este texto al continuar la historia. Refleja su estado actual, ubicaciones, objetos, relaciones y hechos en curso. Si entra en conflicto con un detalle viejo del chat, prioriza este prompt continuo salvo que el jugador diga lo contrario.\n\n" +
        continuo,
    );
  }

  return parts.join("\n");
}

/** System prompt to turn recent RPG chat into one English image-generation prompt. */
export function buildImagePromptSystem(config: RpgConfig): string {
  const bits: string[] = [
    "You write ONE detailed English image-generation prompt for an RPG scene.",
    "Return ONLY the prompt text. No quotes, no markdown, no dialogue, no commentary.",
    "Describe visuals: subject, setting, lighting, mood, style, composition. Keep it under ~80 words.",
  ];
  if (config.titulo.trim()) bits.push("Game title: " + config.titulo.trim());
  if (config.personajePrincipal.trim()) {
    bits.push("Player character: " + config.personajePrincipal.trim().slice(0, 400));
  }
  if (config.personajes.trim()) {
    bits.push("Other characters: " + config.personajes.trim().slice(0, 400));
  }
  if (config.historia.trim()) {
    bits.push("Story context: " + config.historia.trim().slice(0, 500));
  }
  if (config.promptContinuo.trim()) {
    bits.push("Current state: " + config.promptContinuo.trim().slice(0, 500));
  }
  return bits.join("\n");
}
