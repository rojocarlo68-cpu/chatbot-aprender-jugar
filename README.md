# RPG Chat — Juego de rol

Aplicacion de juego de rol por chat (espanol, oscuro). Sin backend.

## Flujo

### 1. Configuracion
- Titulo
- Personaje principal
- Personajes
- Historia
- Prompt continuo

Jugar requiere Titulo, Historia y Personaje principal.

### 2. Juego
- Chat narrador vs usuario
- System prompt con toda la config + prompt continuo
- Prompt continuo editable en juego
- Volver a Config sin borrar chat

### Ajustes
- API key, base URL, modelo
- Boton "Probar API" (hello de 1 token)
- Borrar chat / reset config

**Proveedor por defecto: Groq (capa gratuita)**
- Clave gratis en https://console.groq.com/keys
- baseUrl: `https://api.groq.com/openai/v1`
- model: `openai/gpt-oss-20b`
- alternativas Groq: `openai/gpt-oss-120b`, `qwen/qwen3.6-27b`
- Nota: `llama-3.3-70b-versatile` y `llama-3.1-8b-instant` se apagaron en capa gratuita (16 ago 2026)
- La clave solo se guarda en localStorage de tu navegador

**Alternativa opcional: OpenRouter** (requiere créditos)
- baseUrl: `https://openrouter.ai/api/v1`
- model: `sao10k/l3.3-euryale-70b`
- alternativa: `cognitivecomputations/dolphin-mistral-24b-venice-edition`
- Configúralo en Ajustes si prefieres esos modelos

## Demo

https://rojocarlo68-cpu.github.io/chatbot-aprender-jugar/

## Desarrollo

Node 20+. Usa los scripts de Vite: install, dev, build.

Base Vite: /chatbot-aprender-jugar/

## Privacidad

Sin servidor propio. Datos en el navegador.
