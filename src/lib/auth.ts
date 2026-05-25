import "server-only";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const SALT_ROUNDS = 12;

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export class AuthError extends Error {
  constructor(message: string, public status: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export async function signup(input: SignupInput) {
  const { email, password, name } = signupSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  await createSession(user.id, user.email, user.role);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function login(input: LoginInput) {
  const { email, password } = loginSchema.parse(input);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AuthError("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid email or password");
  }

  await createSession(user.id, user.email, user.role);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function requireUser(headers: Headers): { id: string; email: string; role: string } {
  const userId = headers.get("x-user-id");
  const email = headers.get("x-user-email");
  const role = headers.get("x-user-role");

  if (!userId || !email || !role) {
    throw new AuthError("Authentication required");
  }

  return { id: userId, email, role };
}

export function requireAdmin(headers: Headers): { id: string; email: string; role: string } {
  const user = requireUser(headers);
  if (user.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  return user;
}
