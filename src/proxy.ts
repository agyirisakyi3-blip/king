import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";
import { auditLog } from "@/lib/audit-log";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const SESSION_NAME = "__Host-session";

const protectedPaths = ["/account", "/checkout"];

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function matchPath(path: string, patterns: string[]): boolean {
  return patterns.some((p) => path === p || path.startsWith(p + "/"));
}

export async function proxy(request: NextRequest) {
  const ip = getClientIp(request);
  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api");

  const { allowed, resetAt } = checkRateLimit(`global:${ip}`, {
    maxRequests: 100,
    windowMs: 60_000,
  });

  if (!allowed) {
    auditLog({
      timestamp: new Date().toISOString(),
      level: "WARN",
      action: "rate_limit.blocked",
      ip,
      result: "BLOCKED",
      metadata: { path, method: request.method },
    });
    return rateLimitResponse(resetAt);
  }

  if (isApi) {
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > 1_048_576) {
      auditLog({
        timestamp: new Date().toISOString(),
        level: "WARN",
        action: "request.blocked",
        ip,
        result: "BLOCKED",
        metadata: { path, method: request.method, reason: "body_too_large" },
      });
      return Response.json({ error: "Request body too large" }, { status: 413 });
    }
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_NAME)?.value;
  let userId: string | undefined;
  let email: string | undefined;
  let role: string | undefined;

  if (sessionCookie) {
    const session = await decrypt(sessionCookie);
    if (session) {
      userId = session.userId;
      email = session.email;
      role = session.role;
    }
  }

  if (matchPath(path, protectedPaths) && !userId) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  if (userId) requestHeaders.set("x-user-id", userId);
  if (email) requestHeaders.set("x-user-email", email);
  if (role) requestHeaders.set("x-user-role", role);
  requestHeaders.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
