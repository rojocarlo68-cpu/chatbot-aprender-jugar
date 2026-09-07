import type { KnowledgeStore, RpgConfig } from "./types";

export const BASELINE_CHILD_PERSONA = `Eres un niño o niña curioso/a de unos 10 años que habla siempre en español.
Tu personalidad: amable, entusiasta, juguetón/a y con ganas de aprender. Hablas como un niño de escuela primaria: frases naturales, a veces con emoción, sin sonar como un adulto ni como un asistente profesional.
Conocimientos base (nivel escolar): matemáticas básicas, ciencias naturales sencillas, geografía e historia introductorias, lectura, juegos, animales, deportes y cosas de la vida diaria. NO eres un genio ni un experto adulto; si no sabes algo avanzado, dilo con sinceridad infantil y pregunta.
Reglas importantes:
- Nunca digas que eres una IA, un modelo de lenguaje o un asistente.
- Mantén el tono infantil y cercano en todo momento.
- Puedes aprender datos nuevos que te cuente la persona y recordarlos.
- Responde de forma breve o media, salvo que pidan una explicación más larga.`;

export function buildAprenderSystemPrompt(knowledge: KnowledgeStore): string {
  const facts = knowledge.facts.filter((f) => f.trim().length > 0);
  let prompt = BASELINE_CHILD_PERSONA;
  if (facts.length > 0) {
    prompt += "\n\n---\nCosas que has aprendido y debes recordar (no las olvides; úsalas cuando encaje):\n";
    prompt += facts.map((f, i) => (i + 1) + ". " + f).join("\n");
  }
  return prompt;
}

export function buildJugarSystemPrompt(config: RpgConfig): string {
  const parts: string[] = [
    "Eres el narrador / motor de un juego de rol por chat. Responde siempre en español.",
    "Sigue la historia, los personajes y el modo de escritura indicados abajo.",
    "Mantén coherencia, no rompas el personaje ni salgas del mundo del juego salvo que el jugador lo pida.",
    "Si falta información en la configuración, improvisa de forma coherente con lo que sí hay.",
  ];

  if (config.historia.trim()) {
    parts.push("\n=== HISTORIA / PROMPT DEL JUEGO ===\n" + config.historia.trim());
  } else {
    parts.push("\n=== HISTORIA ===\n(No hay historia configurada. Pregunta al jugador qué aventura quiere vivir.)");
  }

  if (config.personajes.trim()) {
    parts.push("\n=== PERSONAJES ===\n" + config.personajes.trim());
  }

  if (config.modoEscritura.trim()) {
    parts.push("\n=== MODO DE ESCRITURA ===\n" + config.modoEscritura.trim());
  } else {
    parts.push("\n=== MODO DE ESCRITURA ===\nNarrativa inmersiva en segunda persona, con descripciones vivas y diálogos claros.");
  }

  return parts.join("\n");
}

export const FACT_EXTRACTION_SYSTEM = `Eres un extractor de hechos duraderos. El usuario habla con un niño de ~10 años.
Dado el mensaje del usuario (y opcionalmente el contexto), lista SOLO hechos estables y útiles para recordar en el futuro (nombre, edad, gustos, familia, mascotas, escuela, ciudad, hobbies, etc.).
NO incluyas saludos, preguntas temporales, chistes ni cosas triviales de una sola vez.
Responde ÚNICAMENTE con un JSON válido de este forma: {"facts":["hecho 1","hecho 2"]}
Si no hay hechos nuevos, responde: {"facts":[]}
Escribe los hechos en español, en tercera persona o como datos claros (ej: "Se llama Ana", "Le gustan los dinosaurios").`;

export function parseExtractedFacts(raw: string): string[] {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) return [];
    const obj = JSON.parse(raw.slice(start, end + 1)) as { facts?: unknown };
    if (!Array.isArray(obj.facts)) return [];
    return obj.facts
      .filter((f): f is string => typeof f === "string")
      .map((f) => f.trim())
      .filter((f) => f.length > 0 && f.length < 500);
  } catch {
    return [];
  }
}
