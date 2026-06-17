# Discord Bot Setup

## 1. Discord App anlegen

1. Oeffne das Discord Developer Portal: https://discord.com/developers/applications
2. Erstelle eine neue Application.
3. Gehe zu `Bot` und erstelle den Bot.
4. Fuer Slash-Commands ist kein `Message Content Intent` noetig.
5. Kopiere den Bot-Token.

## 2. Lokale Konfiguration

```bash
cp .env.example .env
```

Trage in `.env` deinen Token ein:

```bash
DISCORD_TOKEN=dein_token
PROJECT_NAME=OpenBoard
```

## 3. Bot einladen

Im Developer Portal unter `OAuth2` -> `URL Generator`:

- Scopes: `bot`
- Bot Permissions: `Send Messages`, `Read Message History`, `View Channels`

Oeffne die generierte URL und lade den Bot auf deinen Server ein.

## 4. Starten

```bash
npm start
```

## Docker

Lokal oder auf dem Server:

```bash
docker compose up -d --build
docker compose logs -f discord-bot
```

Der Bot braucht keinen eingehenden Port. Er verbindet sich ausgehend mit Discord.

## Befehle

- `/ping`
- `/project`
- `/task text:<text>`
