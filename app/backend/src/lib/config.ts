import "dotenv/config";

function requireEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: requireEnv("JWT_SECRET", "development-jwt-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
};
