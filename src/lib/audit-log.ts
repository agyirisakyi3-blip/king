export type AuditAction =
  | "login.attempt"
  | "login.success"
  | "login.failure"
  | "logout"
  | "password.change"
  | "password.reset"
  | "checkout.attempt"
  | "checkout.success"
  | "checkout.failure"
  | "payment.attempt"
  | "payment.success"
  | "payment.failure"
  | "rate_limit.blocked"
  | "request.blocked"
  | "upload.complete";

type AuditResult = "SUCCESS" | "FAILURE" | "BLOCKED";

interface AuditEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  action: AuditAction;
  ip: string;
  userId?: string;
  result: AuditResult;
  metadata?: Record<string, unknown>;
}

const MAX_LOG_VALUE_LENGTH = 500;

function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/\r/g, "")
      .replace(/\n/g, "")
      .trim()
      .slice(0, MAX_LOG_VALUE_LENGTH);
  }
  return value;
}

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(meta)) {
    clean[sanitize(key) as string] = sanitize(val);
  }
  return clean;
}

export function auditLog(entry: AuditEntry): void {
  const sanitized: AuditEntry = {
    ...entry,
    ip: sanitize(entry.ip) as string,
    userId: entry.userId ? (sanitize(entry.userId) as string) : undefined,
    metadata: entry.metadata ? sanitizeMeta(entry.metadata) : undefined,
  };

  if (entry.level === "ERROR") {
    console.error(JSON.stringify(sanitized));
  } else {
    console.log(JSON.stringify(sanitized));
  }
}
