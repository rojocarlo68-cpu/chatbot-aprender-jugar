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

## Demo

https://rojocarlo68-cpu.github.io/chatbot-aprender-jugar/

## API OpenRouter

- baseUrl: https://openrouter.ai/api/v1
- model: sao10k/l3.3-euryale-70b
- alternativa: cognitivecomputations/dolphin-mistral-24b-venice-edition
- clave solo en localStorage

## Desarrollo

Node 20+. Usa los scripts de Vite: install, dev, build.

Base Vite: /chatbot-aprender-jugar/

## Privacidad

Sin servidor propio. Datos en el navegador.
