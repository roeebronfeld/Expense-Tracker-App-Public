# Expense Tracker App

Production-oriented full-stack expense tracking application built as the application layer of a split-repository DevOps platform.

This repository contains the React frontend, Node.js API, Prisma data model, local Docker Compose setup, and the GitHub Actions workflow that builds and publishes container images for the GitOps deployment flow.

## What This Repo Demonstrates

- A real multi-user CRUD application with authentication, categories, expenses, budgets, and user settings.
- A typed backend with a layered structure: routes -> services -> repositories -> Prisma.
- A modern React UI with Vite, TypeScript, Radix UI primitives, TanStack Query, and Recharts.
- Dockerized production images for frontend and backend.
- CI/CD automation that validates the app, builds images, pushes to ECR, and updates GitOps image tags.
- A public-safe version of the project with secrets replaced by placeholders.

## Visual Demo

### Application Walkthrough

![Expense Tracker dashboard preview](docs/assets/dashboard-preview.png)

[Watch the desktop UI demo](docs/assets/app-ui-desktop-demo.mp4)

### CI/CD Automation

[Watch the GitHub Actions CI/CD flow](docs/assets/github-actions-ci-cd-demo.mp4)

## Repository Layout

```text
Expense-Tracker-App/
├── .github/
│   └── workflows/
│       ├── ci.yml              # lint, typecheck, test, build, Docker push
│       └── cd.yml              # update GitOps image tags after CI
├── app/
│   ├── backend/
│   │   ├── prisma/             # schema and migrations
│   │   ├── src/
│   │   │   ├── lib/            # config and JWT helpers
│   │   │   ├── middleware/     # auth and error handling
│   │   │   ├── repositories/   # database access
│   │   │   ├── routes/         # Express route definitions
│   │   │   ├── services/       # business logic
│   │   │   └── __tests__/      # integration tests
│   │   └── Dockerfile
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── pages/
│   │   └── Dockerfile
│   └── docker-compose.yml      # local development stack
├── RUNBOOK.md
└── README.md
```

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, React Router, TanStack Query, Recharts, Radix UI |
| Backend | Node.js 20, Express 5, TypeScript, Prisma, JWT, bcrypt |
| Database | PostgreSQL 16 locally and PostgreSQL on Kubernetes in production |
| Testing | Jest, Supertest, Testcontainers |
| Containers | Multi-stage Dockerfiles, Nginx for frontend, Node runtime for backend |
| CI/CD | GitHub Actions, AWS OIDC, ECR, GitOps repo update |

## Application Flow

```text
Browser
  -> React frontend
  -> /api requests
  -> Express routes
  -> services
  -> repositories
  -> Prisma
  -> PostgreSQL
```

The API validates ownership at the repository/service layer so users can only read or mutate their own categories, expenses, budgets, and settings.

## CI/CD Flow

```text
push to main
  -> backend lint + typecheck + tests + build
  -> frontend lint + build
  -> Docker buildx
  -> push backend/frontend images to ECR
  -> CD workflow updates GitOps prod image tags
  -> ArgoCD syncs the running cluster
```

The public workflow keeps account-specific values as placeholders, for example `123456789012` for the AWS account ID.

## Local Quick Start

```bash
cd app
docker compose up --build
```

Local endpoints:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## Backend Development

```bash
cd app/backend
npm install
npx prisma generate
npm run dev
```

Useful commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The integration tests use Testcontainers, so Docker must be running.

## Frontend Development

```bash
cd app/frontend
npm install
npm run dev
```

The Vite dev server proxies API traffic to the backend during local development.

## Environment Variables

Use `.env.example` files as templates. Do not commit real `.env` files.

Typical backend values:

```env
DATABASE_URL=postgresql://app:apppass@localhost:5432/expensetracker
PORT=3000
NODE_ENV=development
JWT_SECRET=replace-me-with-a-long-random-secret
JWT_EXPIRES_IN=1d
```

## Related Repositories

- [Expense-Tracker-Infra-Public](https://github.com/roeebronfeld/Expense-Tracker-Infra-Public) provisions AWS, EKS, ECR, IAM, Secrets Manager, ArgoCD, and the ephemeral platform stack.
- [Expense-Tracker-gitops-Public](https://github.com/roeebronfeld/Expense-Tracker-gitops-Public) contains the ArgoCD app-of-apps model, Helm charts, and production values.

## Operational Notes

- See [RUNBOOK.md](RUNBOOK.md) for local and production-oriented application operations.
- The production database migrations are handled by a Kubernetes PreSync job in the GitOps repository, not by every backend container at startup.
- This public repo is intentionally sanitized: real AWS account IDs, GitHub App IDs, private repo names, tokens, and private keys are not committed.
