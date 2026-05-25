import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { requireUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit-log";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeLog } from "@/lib/validate";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const ip = sanitizeLog(request.headers.get("x-forwarded-for") ?? "unknown");

  const { allowed, resetAt } = checkRateLimit(`upload:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    requireUser(request.headers);
  } catch {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
    return Response.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: `File type ${file.type} not allowed. Use JPEG, PNG, WebP, or GIF.` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = `${crypto.randomUUID()}.${ext.replace(/[^a-zA-Z0-9]/g, "")}`;
  const uploadDir = join(process.cwd(), "public", "uploads");
  const filePath = join(uploadDir, safeName);

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  auditLog({
    timestamp: new Date().toISOString(),
    level: "INFO",
    action: "upload.complete",
    ip,
    result: "SUCCESS",
    metadata: { file: safeName, size: file.size, type: file.type },
  });

  return Response.json({ url: `/uploads/${safeName}` });
}
