# F1 Analytics for Noobs

A full-stack Formula 1 analytics website for beginners. Uses [FastF1](https://docs.fastf1.dev/) for race telemetry, timing, and schedule data; [jolpica-f1](https://github.com/jolpica/jolpica-f1) for championship standings; and [Groq](https://console.groq.com/docs/overview) to explain telemetry and pace gaps in plain English.

## Features

- **Telemetry** — Braking, throttle, speed, and lap times per driver
- **Race positions** — Position changes over laps
- **Tyre strategy** — Stint visualization with compound colors
- **Pace gap** — Gap to race leader lap-by-lap
- **Standings** — 2026 driver and constructor championships
- **GP countdown** — Countdown to every 2026 Grand Prix
- **AI explanations** — Groq-powered beginner-friendly summaries
- **F1 for Noobs** — Glossary and ask-anything AI tab
- **Auto-update** — Defaults to the latest completed race; refreshes every 6 hours

## Project Structure

```
f1noobs/
├── backend/     FastAPI + FastF1 + Groq
├── frontend/    Next.js 14 + Recharts
└── docker-compose.yml
```

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Groq API key ([console.groq.com](https://console.groq.com))

## Quick Start (Local)

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Edit `backend/.env` and set your `GROQ_API_KEY`.

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Your Groq API key (required for AI features) |
| `GROQ_MODEL` | Model name (default: `llama-3.3-70b-versatile`) |
| `FASTF1_CACHE_DIR` | FastF1 cache directory (default: `./cache`) |
| `SEASON` | F1 season year (default: `2026`) |
| `CORS_ORIGINS` | Allowed frontend origins |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base (default: `http://localhost:8000/api/v1`) |

## Docker

```bash
# Create backend/.env with GROQ_API_KEY first
docker compose up --build
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/season/2026/schedule` | Full 2026 calendar |
| `GET /api/v1/season/2026/latest-race` | Latest completed race |
| `GET /api/v1/season/2026/countdown` | Next GP countdown |
| `GET /api/v1/race/{round}/telemetry?driver=VER` | Telemetry data |
| `GET /api/v1/race/{round}/lap-times?driver=VER` | Lap times |
| `GET /api/v1/race/{round}/positions` | Position chart data |
| `GET /api/v1/race/{round}/tyre-strategy?driver=VER` | Tyre stints |
| `GET /api/v1/race/{round}/pace-gap?driver=VER` | Pace gap vs leader |
| `GET /api/v1/standings/drivers?season=2026` | Driver standings |
| `GET /api/v1/standings/constructors?season=2026` | Constructor standings |
| `POST /api/v1/explain/telemetry` | AI telemetry explanation |
| `POST /api/v1/explain/pace-gap` | AI pace gap explanation |
| `GET /api/v1/explain/f1-glossary` | Static F1 glossary |
| `POST /api/v1/explain/ask` | Ask anything about F1 |
| `POST /api/v1/admin/refresh` | Manually refresh latest race cache |

## Notes

- FastF1 session data (telemetry, laps) is available ~30–120 minutes after a race ends.
- The first load of a session can take 30–60 seconds; subsequent loads use disk cache.
- This project is unofficial and not affiliated with Formula 1.

## License

MIT
