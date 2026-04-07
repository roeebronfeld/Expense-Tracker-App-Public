import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "./config";

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AuthTokenPayload) {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, config.jwtSecret, {
    ...options,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}
