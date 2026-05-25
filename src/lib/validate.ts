const MAX_DEPTH = 6;
const MAX_BODY_BYTES = 1_048_576;
const MAX_LOG_VALUE_LENGTH = 500;

export function sanitizeLog(value: string): string {
  return value.replace(/\r/g, "").replace(/\n/g, "").trim().slice(0, MAX_LOG_VALUE_LENGTH);
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function getDepth(value: unknown, depth = 0): number {
  if (depth > MAX_DEPTH) return depth;
  if (Array.isArray(value)) {
    return value.reduce((max, item) => Math.max(max, getDepth(item, depth + 1)), depth);
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).reduce(
      (max, item) => Math.max(max, getDepth(item, depth + 1)),
      depth
    );
  }
  return depth;
}

export function validateJsonBody(body: unknown): asserts body is Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Body must be a JSON object");
  }
  if (getDepth(body) > MAX_DEPTH) {
    throw new ValidationError("JSON nesting depth exceeds limit");
  }
}

export async function validateRequestSize(request: Request): Promise<void> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new ValidationError("Request body too large");
  }
}
