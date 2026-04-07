import type { AuthenticatedUser } from "../middleware/authenticate";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

export {};
