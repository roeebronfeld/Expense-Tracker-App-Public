import path from "node:path";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import request from "supertest";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { PrismaClient } from "@prisma/client";
import { createServer } from "../server";

jest.setTimeout(120000);

const canUseDockerRuntime =
  fs.existsSync("/var/run/docker.sock") || fs.existsSync(`${process.env.HOME ?? ""}/.docker/run/docker.sock`);

const externalDatabaseUrl = process.env.DATABASE_URL;
const runIntegrationSuite = Boolean(externalDatabaseUrl) || canUseDockerRuntime;
const describeIntegration = runIntegrationSuite ? describe : describe.skip;

describeIntegration("Expense Tracker API", () => {
  let container: StartedTestContainer;
  let prisma: PrismaClient;
  let app: ReturnType<typeof createServer>;
  let authToken = "";
  let categoryId = "";
  const projectRoot = path.resolve(__dirname, "../..");

  beforeAll(async () => {
    let databaseUrl = externalDatabaseUrl;

    if (!databaseUrl) {
      container = await new GenericContainer("postgres:16-alpine")
        .withEnvironment({
          POSTGRES_USER: "app",
          POSTGRES_PASSWORD: "apppass",
          POSTGRES_DB: "expensetracker",
        })
        .withExposedPorts(5432)
        .start();

      databaseUrl = `postgresql://app:apppass@${container.getHost()}:${container.getMappedPort(
        5432,
      )}/expensetracker?schema=public`;
    }

    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1d";

    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      cwd: projectRoot,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: "inherit",
    });

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    app = createServer({ prisma });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  it("GET /health returns status and build version", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.version).toBeDefined();
  });

  it("registers a user and returns a JWT", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "devops@example.com",
      password: "StrongPass1",
      fullName: "Dev Ops",
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe("devops@example.com");

    authToken = response.body.token;
  });

  it("loads the current user profile from the JWT", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("devops@example.com");
  });

  it("seeds default categories for the user", async () => {
    const response = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);

    categoryId = response.body.items[0].id;
  });

  it("creates an expense on the authenticated user's category", async () => {
    const response = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amountCents: 1500,
        categoryId,
        merchant: "Coffee Shop",
        note: "Flat white",
      });

    expect(response.status).toBe(201);
    expect(response.body.item.amountCents).toBe(1500);
    expect(response.body.item.categoryId).toBe(categoryId);
    expect(response.body.item.category).toBe(categoryId);
  });

  it("creates and lists budgets for the authenticated user only", async () => {
    const createResponse = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        categoryId,
        amountCents: 50000,
        period: "monthly",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.item.categoryId).toBe(categoryId);

    const listResponse = await request(app)
      .get("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
  });

  it("blocks unauthenticated access to protected routes", async () => {
    const response = await request(app).get("/api/expenses");

    expect(response.status).toBe(401);
  });

  it("exports only the authenticated user's data", async () => {
    const response = await request(app)
      .get("/api/export")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.categories.length).toBeGreaterThan(0);
    expect(response.body.expenses.length).toBe(1);
    expect(response.body.budgets.length).toBe(1);
  });
});

if (!runIntegrationSuite) {
  // This message helps contributors understand why the suite is skipped locally.
  // The suite will run automatically in environments with Docker or an injected DATABASE_URL.
  // eslint-disable-next-line no-console
  console.warn(
    "Skipping integration tests: no Docker runtime and no DATABASE_URL provided for PostgreSQL.",
  );
}
