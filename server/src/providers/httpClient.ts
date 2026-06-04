import { logger } from "../lib/logger.js";

export interface ProviderClientOptions {
  baseUrl: string;
  apiKey?: string;
  authHeader?: string; // header name for the key; default "Authorization"
  timeoutMs?: number;
}

/**
 * Thin fetch wrapper for external providers (Altenar, iGamingAPIs, Gambly).
 * Adds timeout, JSON handling, retries on 5xx/network with backoff.
 */
export class ProviderClient {
  constructor(private opts: ProviderClientOptions) {}

  async request<T>(
    path: string,
    init: RequestInit & { retries?: number } = {},
  ): Promise<T> {
    const { retries = 2, ...rest } = init;
    const url = `${this.opts.baseUrl.replace(/\/$/, "")}${path}`;
    const headers = new Headers(rest.headers);
    headers.set("accept", "application/json");
    if (this.opts.apiKey) {
      headers.set(this.opts.authHeader ?? "Authorization", this.opts.apiKey);
    }

    let lastErr: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.opts.timeoutMs ?? 10_000);
      try {
        const res = await fetch(url, { ...rest, headers, signal: ctrl.signal });
        clearTimeout(timer);
        if (res.status >= 500) throw new Error(`Provider ${res.status}`);
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Provider ${res.status}: ${body.slice(0, 200)}`);
        }
        return (await res.json()) as T;
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        if (attempt < retries) {
          const backoff = 250 * 2 ** attempt;
          logger.warn({ url, attempt, backoff }, "provider request retry");
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }
    throw lastErr;
  }
}
