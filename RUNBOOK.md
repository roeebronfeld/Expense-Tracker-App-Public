# Expense Tracker Application Runbook

This runbook explains how to run, test, deploy, and rebuild the application layer of the Expense Tracker platform.

## Scope

This runbook focuses on:

- local backend development
- database migrations
- test execution
- image publishing expectations
- interaction with the Terraform and GitOps layers

## Application Structure

```text
Expense-Tracker-App/
└── app/
    └── backend/
        ├── prisma/
        ├── src/
        │   ├── middleware/
        │   ├── repositories/
        │   ├── routes/
        │   ├── services/
        │   └── __tests__/
        ├── Dockerfile
        └── package.json
```

## Prerequisites

- Node.js 20+
- npm
- Docker
- PostgreSQL, either locally or via Docker

## Local Backend Startup

### 1. Start PostgreSQL

```bash
docker run --name expense-pg \
  -e POSTGRES_USER=app \
  -e POSTGRES_PASSWORD=apppass \
  -e POSTGRES_DB=expensetracker \
  -p 5432:5432 -d postgres:16
```

### 2. Configure environment

```bash
cd app/backend
cp .env.example .env
```

Recommended `.env` values:

```env
DATABASE_URL=postgresql://app:apppass@localhost:5432/expensetracker
PORT=3000
NODE_ENV=development
JWT_SECRET=replace-me-with-a-long-random-secret
JWT_EXPIRES_IN=1d
```

### 3. Install dependencies and generate Prisma client

```bash
npm install
npx prisma generate
```

### 4. Apply migrations

```bash
npx prisma migrate deploy
```

### 5. Start the API

```bash
npm run dev
```

### 6. Smoke test

```bash
curl http://localhost:3000/health
```

## Authentication Flow

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"StrongPass1","fullName":"Demo User"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"StrongPass1"}'
```

### Access a protected route

```bash
TOKEN="<paste-jwt-here>"

curl http://localhost:3000/api/categories \
  -H "Authorization: Bearer ${TOKEN}"
```

## Test Execution

The backend test suite now targets the real Express application and boots a temporary PostgreSQL container for integration testing.

Run:

```bash
cd app/backend
npm test
```

Requirements:

- Docker daemon must be running
- npm dependencies must be installed

## Build and Containerization

### Build the backend locally

```bash
cd app/backend
npm run build
```

### Build the Docker image

```bash
docker build -t expense-tracker-backend:local app/backend
```

## Fresh Deploy From Scratch

1. Provision infrastructure with Terraform from [`Expense-Tracker-Infra`](/home/roeebron/projects/repo-split-workspace/Expense-Tracker-Infra).
2. Build and push application images to ECR.
3. Tag the images according to the GitOps values files.
4. Let ArgoCD converge the workloads.

## Image Tag Expectations

The GitOps repo currently expects explicit image tags in the environment values files, for example:

- backend: `v1.0.0`
- frontend: `v1.0.0`

If you publish a new version, update the matching GitOps values file or automate it in CI.

## Destroy / Rebuild Workflow

For complete platform teardown, use:

- [`Expense-Tracker-Infra/DESTROY_RUNBOOK.md`](/home/roeebron/projects/repo-split-workspace/Expense-Tracker-Infra/DESTROY_RUNBOOK.md)

After destroy:

1. `terraform apply`
2. push images to ECR
3. wait for ArgoCD sync
4. verify health endpoints and ingress

## Production-Like Notes

- JWT protects all business endpoints
- every business row belongs to a concrete `userId`
- Prisma models now use actual relations instead of string prefixes
- routes, services, and repositories are separated for maintainability
- tests exercise the real server instead of a mocked Express clone
