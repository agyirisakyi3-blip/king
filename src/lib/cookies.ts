import { cookies } from "next/headers";

export interface SecureCookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  path?: string;
}

function assertHostPrefix(name: string) {
  if (!name.startsWith("__Host-")) {
    throw new Error(
      `Auth cookies must use the __Host- prefix for domain locking. Got: ${name}`
    );
  }
}

export async function setAuthCookie({ name, value, maxAge, path }: SecureCookieOptions) {
  assertHostPrefix(name);
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: path ?? "/",
    maxAge: maxAge ?? 60 * 60 * 24 * 7,
  });
}

export async function deleteAuthCookie(name: string) {
  assertHostPrefix(name);
  const cookieStore = await cookies();
  cookieStore.delete(name);
}

export async function getAuthCookie(name: string) {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value ?? null;
}
