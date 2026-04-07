# Expense Tracker

Full-stack expense tracking application with production-grade DevOps infrastructure.

## Quick Start

```bash
cd app
docker compose up
# Frontend: http://localhost:5173
# Backend:  http://localhost:3000/health
```

## Project Structure

```
app/
  backend/           # Node.js + Express + Prisma
  frontend/          # React + Vite + TypeScript
  docker-compose.yml # Local development
.github/workflows/   # CI/CD pipelines
```

## Architecture

| Layer | Tool | Purpose |
|-------|------|---------|
| AWS Infra | Terraform | VPC, EKS, ECR, IAM, GitHub OIDC |
| K8s Apps | ArgoCD | ALB Controller, PostgreSQL, Backend, Frontend, Monitoring |

## Tech Stack

| Category | Technologies |
|----------|-------------|
| App | Node.js, Express, Prisma, React, Vite, TypeScript |
| Infra | AWS (EKS, ECR), Terraform, Helm, ArgoCD |
| Monitoring | Prometheus, Grafana (kube-prometheus-stack) |
| CI/CD | GitHub Actions + OIDC |

## CI/CD Flow

```
Push to main -> CI (lint, test, build, push to ECR) -> CD (update values.yaml) -> ArgoCD sync
```

## Operations

See [RUNBOOK.md](RUNBOOK.md) for deployment, teardown, and troubleshooting.

## Related Repos

- [Expense-Tracker-gitops](https://github.com/roeebronfeld/Expense-Tracker-gitops) - Helm charts, ArgoCD config
- [Expense-Tracker-Infra](https://github.com/roeebronfeld/Expense-Tracker-Infra) - Terraform (AWS)

## License

MIT

