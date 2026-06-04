import { env } from "../config/env.js";
import { ProviderClient } from "./httpClient.js";

// Lazily constructed singletons. Each maps to one casino integration.
export const igamingClient = new ProviderClient({
  baseUrl: env.IGAMING_API_BASE_URL || "https://example.invalid",
  apiKey: env.IGAMING_API_KEY,
});

export const gamblyClient = new ProviderClient({
  baseUrl: env.GAMBLY_API_BASE_URL || "https://example.invalid",
  apiKey: env.GAMBLY_API_KEY,
});

export const providersConfigured = {
  igaming: Boolean(env.IGAMING_API_BASE_URL && env.IGAMING_API_KEY),
  gambly: Boolean(env.GAMBLY_API_BASE_URL && env.GAMBLY_API_KEY),
};
