import { auditLog } from "@/lib/audit-log";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { safeFetch } from "@/lib/ssrf";
import { sanitizeLog, validateJsonBody, validateRequestSize, ValidationError } from "@/lib/validate";

export const maxDuration = 30;

export async function POST(request: Request) {
  const ip = sanitizeLog(request.headers.get("x-forwarded-for") ?? "unknown");

  const { allowed, resetAt } = checkRateLimit(`checkout:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (!allowed) {
    auditLog({
      timestamp: new Date().toISOString(),
      level: "WARN",
      action: "rate_limit.blocked",
      ip,
      result: "BLOCKED",
      metadata: { route: "checkout" },
    });
    return rateLimitResponse(resetAt);
  }

  let body: { productId?: string; price?: number; imageUrl?: string };
  try {
    await validateRequestSize(request);
    const raw = await request.json();
    validateJsonBody(raw);
    body = raw as typeof body;
  } catch (error) {
    auditLog({
      timestamp: new Date().toISOString(),
      level: "WARN",
      action: "checkout.failure",
      ip,
      result: "FAILURE",
      metadata: { reason: error instanceof ValidationError ? error.message : "Invalid request" },
    });
    const message = error instanceof ValidationError ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }

  const session = requireUser(request.headers);

  if (body.imageUrl) {
    try {
      await safeFetch(body.imageUrl, { method: "HEAD" });
    } catch {
      return Response.json({ error: "Invalid image URL" }, { status: 400 });
    }
  }

  if (body.price !== undefined) {
    const rows = await query("SELECT id, price FROM products WHERE id = $1", body.productId);
    const product = rows[0] as { id: string; price: number } | undefined;
    if (!product || product.price !== body.price) {
      return Response.json({ error: "Price mismatch" }, { status: 409 });
    }
  }

  auditLog({
    timestamp: new Date().toISOString(),
    level: "INFO",
    action: "checkout.attempt",
    ip,
    userId: session.id,
    result: "SUCCESS",
  });

  return Response.json({ error: "Not implemented" }, { status: 501 });
}
