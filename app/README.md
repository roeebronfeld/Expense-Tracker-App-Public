# Expense Tracker Application

## Running Locally

### Docker Compose (recommended)

Important for WSL users:

- Docker Desktop must be installed
- WSL integration must be enabled for the distro you use
- `docker` must work inside the terminal before you continue

```bash
cd app
docker compose up --build
```

Services:
- PostgreSQL: `localhost:5432`
- Backend API: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Useful commands:
```bash
docker compose down          # Stop all
docker compose down -v       # Stop and reset DB
docker compose logs -f backend
docker compose logs -f frontend
docker compose exec backend npx prisma migrate deploy
docker compose exec db psql -U app -d expensetracker
```

### Manual (for development)

Terminal 1 - Database:
```bash
cd app
docker compose up db
```

Terminal 2 - Backend:
```bash
cd app/backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Terminal 3 - Frontend:
```bash
cd app/frontend
cp .env.example .env
npm install
npm run dev
```

### Open From Your Phone

This setup supports phone access without changing the production architecture.

How it works:

- the frontend runs on port `5173`
- Vite proxies `/api` requests to the backend
- your phone only needs to open the frontend URL on your computer's LAN IP

Steps:

1. Make sure your phone and computer are on the same Wi-Fi network.
2. Start the application:

```bash
cd app
docker compose up --build
```

3. Find your computer's local IP address.

On Windows PowerShell:
```powershell
ipconfig
```

On Linux / WSL:
```bash
hostname -I
```

4. Open this URL on your phone browser:

```text
http://YOUR_COMPUTER_IP:5173
```

Example:
```text
http://192.168.1.23:5173
```

If it does not open:

- allow port `5173` through your firewall
- make sure Docker Desktop and WSL networking are active
- confirm `docker compose ps` shows frontend and backend as running

## Backend

- Runtime: Node.js 20
- Framework: Express 5
- ORM: Prisma
- Database: PostgreSQL 16
- Language: TypeScript

Scripts:
- `npm run dev` - development mode
- `npm run build` - compile TypeScript
- `npm run lint` - ESLint
- `npm run typecheck` - type checking
- `npm test` - run tests

## Frontend

- Framework: React 18
- Build Tool: Vite
- Language: TypeScript
- UI Library: shadcn/ui + Radix UI
- Styling: Tailwind CSS

Scripts:
- `npm run dev` - development server
- `npm run build` - production build
- `npm run lint` - ESLint

## Database

Connection string (local):
```
DATABASE_URL="postgresql://app:apppass@localhost:5432/expensetracker"
```

Migrations:
```bash
cd backend && npx prisma migrate dev
```

Seed categories:
```bash
cd backend && npx ts-node seed-categories.ts
```

## API Endpoints

### Health Check
```
GET /health -> { "ok": true }
```

### Auth
```
POST /api/auth/register
POST /api/auth/login
```

### Expenses
```
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
```

### Categories & Budgets
```
GET  /api/categories
POST /api/budgets
GET  /api/budgets
```

## Environment Variables

Create `.env` in `backend/`:
```env
DATABASE_URL="postgresql://app:apppass@localhost:5432/expensetracker"
PORT=3000
NODE_ENV=development
JWT_SECRET=replace-me-with-a-long-random-secret
JWT_EXPIRES_IN=1d
```

## Testing

```bash
cd backend && npm run build && npm test
cd frontend && npm run build
```

Note:

- backend integration tests require Docker or a valid `DATABASE_URL`
- frontend currently verifies via `npm run build`
