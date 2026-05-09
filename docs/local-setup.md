# Local Setup

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (running locally or via Docker)
- npm

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env

# 3. Start PostgreSQL (if using Docker)
docker-compose up -d

# 4. Apply database migrations
npx prisma migrate deploy

# 5. Seed development data (20 games + 2 users)
npx prisma db seed

# 6. Start the dev server
npm run dev
```

The app runs at `http://localhost:3000`.

## Environment Variables

```bash
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gamevault"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

`NEXTAUTH_SECRET` must be a long random string in production. Generate one with:

```bash
openssl rand -base64 32
```

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@gamevault.com | Admin123! |
| Customer | john@example.com | Customer123! |

## Database Management

```bash
# View data in Prisma Studio (browser UI)
npx prisma studio

# Create a new migration after schema changes
npx prisma migrate dev --name describe_what_changed

# Apply pending migrations (CI / production)
npx prisma migrate deploy

# Re-run seed (safe: all upserts, no duplicates)
npx prisma db seed

# Reset database and re-seed (destructive)
npx prisma migrate reset
```

## Docker Compose

If you don't have PostgreSQL installed locally, the included `docker-compose.yml` starts a containerized instance:

```bash
docker-compose up -d    # start in background
docker-compose down     # stop
docker-compose down -v  # stop and delete data volume
```

## Project Commands

```bash
npm run dev        # start dev server (hot reload)
npm run build      # production build
npm run start      # start production server
npm run lint       # run ESLint
npx tsc --noEmit   # type check without emitting files
```

## Resetting Seed Data

The seed is idempotent — running it multiple times is safe. It uses `upsert` for users and genres. Products are checked by slug before creation.

To completely reset:

```bash
npx prisma migrate reset  # drops and recreates DB, runs migrations, then seeds
```

## Common Issues

**"Can't reach database server"**
- Confirm PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check `DATABASE_URL` in `.env` matches your PostgreSQL credentials

**"Please specify Prisma schema file"**
- Run commands from the project root, not from `src/`

**"NEXTAUTH_SECRET is missing"**
- Add it to `.env`. Any string works for development

**Prisma client out of date after schema changes**
- Run `npx prisma generate` to regenerate the client

## Docker

`docker-compose up -d` starts PostgreSQL 15 with pgvector pre-installed.

## UI

shadcn/ui Button, Card, Dialog, Table, Toast used throughout storefront.

## Tooling

Strict TS + ESLint. No implicit `any` without explicit justification.

## Seed Data

`npm run db:seed` loads 50 PS4/PS5 games with embeddings.

## Payment Testing

Stripe test mode. Use card `4242 4242 4242 4242`.

## Embeddings

Pre-generated embeddings in `prisma/seed-embeddings.json`.

## Local LLM

Set `HUGGINGFACE_API_KEY` for cloud inference or use ollama.
