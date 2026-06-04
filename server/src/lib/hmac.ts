import crypto from "node:crypto";

/**
 * Compute the hex HMAC-SHA256 of a body using the user-specific secret.
 * Matches Gamble Hub doc §7: signature = hex(HMAC_SHA256(body_bytes, secret)).
 * The body MUST be the exact bytes that were/will be sent over the wire.
 */
export function signHmacSha256Hex(body: Buffer | string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Constant-time verification of an incoming X-Signature header against the raw
 * request body. Returns false on any mismatch (including length / malformed hex)
 * rather than throwing, so callers can return a clean 400.
 */
export function verifyHmac(rawBody: Buffer | string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = signHmacSha256Hex(rawBody, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  // timingSafeEqual throws if lengths differ; guard first to stay constant-time-ish.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
