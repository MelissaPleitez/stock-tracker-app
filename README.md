# Stock Tracker Backend


## What it does

Stock Tracker Backend serves as the brain of the Stock Tracker application. It connects to the Finnhub financial API to stream live stock prices, manages user authentication, processes price alerts in real time, and delivers push notifications via Firebase Cloud Messaging when a stock reaches a user-defined target price.

## Why these technologies

- **Node.js + TypeScript** — Type safety catches bugs at compile time, not in production. TypeScript also makes the codebase self-documenting, which is critical in a team environment.
- **Express.js** — Minimal and flexible. For an API of this scope, Express provides everything needed without the overhead of a heavier framework.
- **Prisma ORM** — Schema-first database management with auto-generated TypeScript types. Migrations are version-controlled alongside the code, making database changes traceable and reversible.
- **PostgreSQL** — Battle-tested relational database. The alert system requires reliable foreign key relationships between users and alerts or notifications, which PostgreSQL handles with ACID compliance.
- **Socket.io** — Enables bidirectional real-time communication. When a price alert triggers, the frontend badge updates instantly without polling.
- **Docker** — Eliminates "works on my machine" problems. The entire stack runs with a single command on any machine with Docker installed.

## Live Demo

- **API:** https://stock-tracker-backend-0ky0.onrender.com

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js 5 |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Real-time | Socket.io + Finnhub WebSocket |
| Notifications | Firebase Admin SDK (FCM) |
| Containerization | Docker + Docker Compose |
| Deployment | Render |

## Project Structure

```
stock-tracker-backend/
├── prisma/
│   ├── migrations/          # Version-controlled database migrations
│   └── schema.prisma        # Database schema definition
├── src/
│   ├── config/
│   │   ├── env.ts           # Environment variable validation
│   │   └── prisma.ts        # Prisma singleton
│   ├── middleware/
│   │   └── auth.ts          # JWT verification middleware
│   ├── routes/
│   │   ├── auth.ts          # Register, login, FCM token update
│   │   ├── stocks.ts        # Real-time stock quotes
│   │   ├── alerts.ts        # Price alert CRUD
│   │   └── notifications.ts # In-app notification center
│   ├── services/
│   │   ├── finnhub.ts       # Finnhub REST + WebSocket integration
│   │   ├── firebase.ts      # FCM push notification sender
│   │   └── alertChecker.ts  # Price alert checker
│   ├── types/
│   │   └── index.ts         # Shared TypeScript interfaces
│   └── index.ts             # Server entry point
├── .env.example             # Environment variable template
├── docker-compose.yml       # PostgreSQL + API orchestration
├── Dockerfile               # Multi-stage production build
└── prisma.config.ts         # Prisma v7 datasource configuration
```

## Architecture

The project follows a layered architecture where each layer has a single responsibility:

```
HTTP Request
     ↓
  Routes        → validates input, returns HTTP response
     ↓
  Services      → business logic (Finnhub, Firebase, AlertChecker)
     ↓
  Prisma Client → database queries
     ↓
  PostgreSQL
```

## Prerequisites

- Node.js 20.19+
- Docker and Docker Compose
- Finnhub API key — free at https://finnhub.io
- Firebase project with a service account private key

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/MelissaPleitez/stock-tracker-app.git
cd stock-tracker-app
```

### 2. Install dependencies

```bash
npm install
npx prisma generate
npm run build
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Create or open `.env` and fill in your values, for example:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracker_stocks"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=tracker_stocks
POSTGRES_PORT=5432  or you can use 5433

# Server
PORT=3000
NODE_ENV=development

# Auth
JWT_SECRET=your_secure_secret_here

# Finnhub — get your free key at https://finnhub.io
FINNHUB_API_KEY=your_finnhub_api_key

# Firebase — download service account JSON from Firebase Console
# Project Settings → Service accounts → Generate new private key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Start PostgreSQL with Docker

Note: If you have PostgresSQL installed locally, stop the service before running Docker Compose or change the exposed port in both env(5433) and in yml file(5433:5432).

```bash
docker-compose up postgres -d
```

### 5. Run database migrations

```bash
npx prisma migrate dev
```

### 6. Start the development server

```bash
npm run dev
```

The server starts at `http://localhost:3000` or any other local server in your environment

You should see:

```
Server running on port 3000
Finnhub WebSocket connected
Alert checker initialized (runs continuously with 30s delay)
```

## Docker Deployment

Run the complete stack — API and PostgreSQL — with a single command:

```bash
docker-compose up -d
```

Prisma migrations run automatically on startup. The API will be available at `http://localhost:3000` or any other local server in your environment.

## API Reference

All protected routes require the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create a new account |
| POST | `/auth/login` | No | Login and receive JWT |
| PUT | `/auth/fcm-token` | No | Register device for push notifications |

**Register / Login request body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "email": "user@example.com" }
}
```

### Stocks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stocks` | Yes | Get all tracked stocks with live prices |
| GET | `/stocks/:symbol` | Yes | Get a single stock quote |

**Tracked symbols:** `AAPL`, `GOOGL`, `MSFT`, `AMZN`, `TSLA`

**Response:**
```json
[
  {
    "symbol": "AAPL",
    "price": 300.25,
    "change": 2.04,
    "changePercent": 0.68,
    "high": 303.20,
    "low": 296.52,
    "open": 297.91,
    "previousClose": 298.21
  }
]
```

### Alerts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/alerts` | Yes | Create a price alert |
| GET | `/alerts` | Yes | Get all alerts for the logged-in user |
| DELETE | `/alerts/:id` | Yes | Delete an alert |

**Create alert request body:**
```json
{
  "symbol": "AAPL",
  "targetPrice": 290.00
}
```

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Yes | Get all in-app notifications |
| PUT | `/notifications/read-all` | Yes | Mark all notifications as read |
| PUT | `/notifications/:id/read` | Yes | Mark a single notification as read |

---

Built by Melissa Pleitez