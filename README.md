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
- Borrar chat / reset config

**Proveedor por defecto: Groq (capa gratuita)**
- Clave gratis en https://console.groq.com/keys
- baseUrl: `https://api.groq.com/openai/v1`
- model: `llama-3.3-70b-versatile`
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
