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

1. Abre la app (en Pages o en local).
2. Pulsa **Ajustes**.
3. Pega tu clave en **Clave de API** (Groq, OpenAI u otro proveedor compatible).
4. Opcional: cambia la **URL base** y el **modelo**.

Valores por defecto:
- URL base: `https://api.groq.com/openai/v1`
- Modelo: `llama-3.3-70b-versatile`

La clave **solo** se guarda en el localStorage de tu navegador. Nunca se sube al repositorio.

### Obtener una clave gratis (Groq)

1. Crea una cuenta en https://console.groq.com/
2. Genera una API key.
3. Pégala en Ajustes de esta app.

También puedes usar OpenAI (`https://api.openai.com/v1`) u otro endpoint compatible con Chat Completions.

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
