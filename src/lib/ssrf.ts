import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SSRFError";
  }
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const int = ipv4ToInt(ip);
  if (int === null) return false;

  if (int === 0x00000000) return true;
  if ((int >>> 24) === 10) return true;
  if ((int >>> 24) === 127) return true;
  if ((int >>> 20) === 2753) return true;
  if ((int >>> 16) === 49320) return true;
  if ((int >>> 16) === 65164) return true;
  if ((int >>> 24) === 169) return true;
  if ((int >>> 22) === 101) return true;
  if ((int >>> 15) === 396) return true;
  if ((int >>> 7) === 198) return true;

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
  if (lower.startsWith("::ffff:") && isPrivateIPv4(lower.replace("::ffff:", ""))) return true;
  return false;
}

function isPrivateIP(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  if (isIP(ip) === 6) return isPrivateIPv6(ip);
  return false;
}

function isPrivateHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === "localhost" ||
    lower === "localhost.localdomain" ||
    lower === "local" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".localhost")
  );
}

export async function validateURL(urlString: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new SSRFError("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SSRFError("Only http and https protocols are allowed");
  }

  const hostname = url.hostname;

  if (hostname === "0.0.0.0") {
    throw new SSRFError("URL resolves to a restricted address");
  }

  if (isPrivateHostname(hostname)) {
    throw new SSRFError("URL resolves to a restricted address");
  }

  if (isIP(hostname) && isPrivateIP(hostname)) {
    throw new SSRFError("URL resolves to a restricted address");
  }

  if (isIP(hostname)) {
    return url;
  }

  try {
    const { address } = await lookup(hostname);
    if (isPrivateIP(address)) {
      throw new SSRFError("URL resolves to a restricted address");
    }
    return url;
  } catch (error) {
    if (error instanceof SSRFError) throw error;
    throw new SSRFError("URL could not be resolved");
  }
}

export async function safeFetch(urlString: string, options?: RequestInit): Promise<Response> {
  const url = await validateURL(urlString);
  return fetch(url, options);
}
