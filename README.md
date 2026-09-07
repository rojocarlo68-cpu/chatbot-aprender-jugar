# Chatbot Aprender y Jugar

Chatbot de doble modo con interfaz en español y tema oscuro. Todo corre en el navegador: no hay backend ni secretos en el repositorio.

## Modos

### Aprender
- Conversación libre con una persona infantil curiosa (~10 años, nivel escolar).
- Extrae datos duraderos de tus mensajes y los guarda en localStorage.
- Esos datos se inyectan en futuros prompts sin borrar la personalidad base.

### Jugar (RPG)
- Rol por chat.
- En **Ajustes** puedes editar campos grandes (al menos 50.000 caracteres) para:
  - Historia / prompt del juego
  - Personajes
  - Modo de escritura (estilo)
- Mientras chateas, el panel **Contexto del juego** (editable y persistente) se inyecta en cada turno del system prompt para anclar la narración al estado vivo de la historia.
- La configuración y el contexto vivo se guardan en localStorage.

## Demo (GitHub Pages)

https://rojocarlo68-cpu.github.io/chatbot-aprender-jugar/

## Cómo poner tu clave de API

Por defecto la app usa **OpenRouter** (API compatible con OpenAI), con un modelo menos moderado pensado para RPG creativo.

1. Abre la app (en Pages o en local).
2. Pulsa **Ajustes**.
3. Pega tu clave de OpenRouter en **Clave de API**.
4. Opcional: cambia la **URL base** y el **modelo**.

Valores por defecto:
- URL base: `https://openrouter.ai/api/v1`
- Modelo: `sao10k/l3.3-euryale-70b` (`is_moderated=false`, adecuado para creativo/RPG)

La clave **solo** se guarda en el localStorage de tu navegador. Nunca se sube al repositorio.

### Obtener una clave (OpenRouter)

1. Crea una cuenta en https://openrouter.ai/
2. Genera una API key en https://openrouter.ai/keys
3. Pégala en Ajustes de esta app (empieza por `sk-or-…`).

OpenRouter y el proveedor del modelo siguen teniendo términos de servicio; este modelo por defecto está menos moderado que opciones filtradas. Puedes elegir otros modelos en https://openrouter.ai/models (busca `is_moderated` false si quieres menos filtros). Alternativa sugerida: `cognitivecomputations/dolphin-mistral-24b-venice-edition`.

También puedes usar Groq, OpenAI u otro endpoint compatible con Chat Completions cambiando la URL base y el modelo.

## Desarrollo local

Requisitos: Node.js 20+.

1. Instala dependencias del proyecto.
2. Arranca el servidor de desarrollo de Vite.
3. Para producción, ejecuta el script de build.

La base de Vite está configurada para GitHub Pages: `/chatbot-aprender-jugar/`.

## Despliegue

El sitio estático se publica en la rama `gh-pages` (GitHub Pages). Tras cambios, construye con Vite y actualiza esa rama.

## Privacidad

- Sin servidor propio.
- API key, chats, conocimiento aprendido y config RPG viven en tu navegador.
- Las peticiones van directamente desde tu navegador al proveedor de LLM que configures.
