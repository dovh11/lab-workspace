# Lab Workspace & Research Progress Management System

A full-stack system for AI research teams to manage documents, track experiments, and schedule journal clubs.

## Project Structure

```
lab-workspace/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py         # Auth dependencies
│   │   │   └── v1/
│   │   │       ├── router.py   # Central API router
│   │   │       └── endpoints/  # Route handlers
│   │   ├── core/
│   │   │   ├── config.py       # Settings & env vars
│   │   │   └── security.py     # JWT & password utils
│   │   ├── db/
│   │   │   ├── base.py         # Model aggregator (for Alembic)
│   │   │   └── session.py      # SQLAlchemy engine + session
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   └── main.py             # FastAPI app factory
│   ├── migrations/             # Alembic migration scripts
│   ├── uploads/                # File upload storage
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # Next.js 14 App Router frontend
│   └── src/
│       ├── app/                # Page routes (App Router)
│       ├── components/         # Reusable UI components
│       ├── lib/                # API client, utils
│       └── types/              # TypeScript type definitions
└── docker-compose.yml          # PostgreSQL + backend container
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or use Docker)

### 1. Start Database (Docker)
```bash
docker-compose up -d postgres
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials

python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your API URL

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Documentation
Once the backend is running, visit [http://localhost:8000/docs](http://localhost:8000/docs) for interactive Swagger UI.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, SQLAlchemy, Alembic, Pydantic v2
- **Database**: PostgreSQL 16
- **Auth**: JWT (python-jose) + bcrypt
- **Container**: Docker + Docker Compose
