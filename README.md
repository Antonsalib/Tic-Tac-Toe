# Tic-Tac-Toe

A browser-based tic-tac-toe game with an AI opponent and a player leaderboard. The frontend is built with React, and an Express API handles AI moves and player statistics using Sequelize with an in-memory SQLite database.

## Features

- Play tic-tac-toe against an AI opponent.
- Save a player name and track wins, losses, ties, and win percentage.
- View and sort the player leaderboard.
- Customize the page background, toggle dark mode, and mute game sounds.

## Requirements

- Node.js and npm
- An OpenAI API key for AI moves

## Setup

Install each app's dependencies:

```bash
cd client
npm install

cd ../server
npm install
```

Create `server/.env` and add your OpenAI API key:

```dotenv
OPENAI_API_KEY=your_openai_api_key
```

Keep the API key private; do not commit the `.env` file.

## Run locally

Start the backend in one terminal:

```bash
cd server
npm start
```

The API listens on [http://localhost:3001](http://localhost:3001).

Start the frontend in a second terminal:

```bash
cd client
npm start
```

The React app opens at [http://localhost:3000](http://localhost:3000). Keep both processes running while playing. The frontend makes API requests to the backend on port 3001.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/game` | Generate an AI move. Send a JSON object containing a `board` array; the response contains the AI output in `aiResponse`. |
| `GET` | `/api/player` | Get all players, ordered by wins and then games. |
| `GET` | `/api/player/:name` | Get one player by name. |
| `POST` | `/api/player/create` | Create a player if they do not already exist. Send `{ "playerName": "Name" }`. |
| `POST` | `/api/player/update` | Record a result. Send `{ "playerName": "Name", "result": "win" }`, where `result` is `win`, `loss`, or `tie`. |

## Data and development

The SQLite database is held in memory, so player statistics are reset when the backend process restarts. On startup, the server synchronizes its model and ensures the AI Player and sample leaderboard players exist.

Run the frontend tests from `client`:

```bash
npm test
```

Create a production frontend build from `client`:

```bash
npm run build
```
