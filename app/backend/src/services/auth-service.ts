import bcrypt from "bcrypt";
import { createUserRepository } from "../repositories/user-repository";
import { createCategoryRepository } from "../repositories/category-repository";
import type { PrismaClient } from "@prisma/client";
import { HttpError } from "../lib/http-error";
import { signAccessToken } from "../lib/jwt";
import { DEFAULT_CATEGORIES } from "../defaultCategories";

export function createAuthService(prisma: PrismaClient) {
  const users = createUserRepository(prisma);
  const categories = createCategoryRepository(prisma);

  return {
    async register(input: { email: string; password: string; fullName: string }) {
      const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
      const fullName =
        typeof input.fullName === "string"
          ? input.fullName.trim()
          : typeof (input as { name?: string }).name === "string"
            ? (input as { name?: string }).name!.trim()
            : "";

      if (!email.includes("@")) {
        throw new HttpError(400, "Valid email is required");
      }
      if (fullName.length === 0) {
        throw new HttpError(400, "Full name is required");
      }
      validatePassword(input.password);

      const existing = await users.findByEmail(email);
      if (existing) {
        throw new HttpError(409, "Email already registered");
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const user = await users.create({
        email,
        passwordHash,
        fullName,
      });

      await categories.createDefaults(
        user.id,
        DEFAULT_CATEGORIES.map((category) => ({ name: category.name })),
      );

      return issueAuthResponse(user.id, user.email, user.fullName);
    },

    async login(input: { email: string; password: string }) {
      const email = input.email.trim().toLowerCase();
      if (!email || !input.password) {
        throw new HttpError(400, "Email and password are required");
      }

      const user = await users.findByEmail(email);
      if (!user) {
        throw new HttpError(401, "Invalid email or password");
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new HttpError(401, "Invalid email or password");
      }

      return issueAuthResponse(user.id, user.email, user.fullName);
    },

    async getCurrentUser(userId: string) {
      const user = await users.findById(userId);
      if (!user) {
        throw new HttpError(404, "User not found");
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      };
    },
  };
}

function validatePassword(password: string) {
  if (typeof password !== "string" || password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    throw new HttpError(400, "Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    throw new HttpError(400, "Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    throw new HttpError(400, "Password must contain at least one number");
  }
}

function issueAuthResponse(userId: string, email: string, fullName: string) {
  const token = signAccessToken({
    sub: userId,
    email,
  });

  return {
    token,
    user: {
      id: userId,
      email,
      fullName,
    },
  };
}
