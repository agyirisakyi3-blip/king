import { auditLog } from "@/lib/audit-log";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeLog, validateJsonBody, ValidationError } from "@/lib/validate";

export const maxDuration = 10;

export async function POST(request: Request) {
  const ip = sanitizeLog(request.headers.get("x-forwarded-for") ?? "unknown");

  const { allowed, resetAt } = checkRateLimit(`login:${ip}`, {
    maxRequests: 5,
    windowMs: 300_000,
  });

  if (!allowed) {
    auditLog({
      timestamp: new Date().toISOString(),
      level: "WARN",
      action: "rate_limit.blocked",
      ip,
      result: "BLOCKED",
      metadata: { route: "login" },
    });
    return rateLimitResponse(resetAt);
  }

  try {
    const raw = await request.json();
    validateJsonBody(raw);
  } catch (error) {
    auditLog({
      timestamp: new Date().toISOString(),
      level: "WARN",
      action: "login.failure",
      ip,
      result: "FAILURE",
      metadata: { reason: error instanceof ValidationError ? error.message : "Invalid JSON" },
    });
    const message = error instanceof ValidationError ? error.message : "Invalid JSON body";
    return Response.json({ error: message }, { status: 400 });
  }

  return Response.json({ error: "Not implemented" }, { status: 501 });
}
