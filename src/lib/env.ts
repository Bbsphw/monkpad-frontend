// src/lib/env.ts
/**
 * Centralized env resolver for both server & client.
 * - Server reads BACKEND_API_BASE_URL primarily
 * - Client can only "see" NEXT_PUBLIC_* variables
 */
const isServer = typeof window === "undefined";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

/**
 * API_BASE_URL:
 * - On server: prefer BACKEND_API_BASE_URL; fallback to NEXT_PUBLIC_API_BASE_URL
 * - On client: only NEXT_PUBLIC_API_BASE_URL is available
 */
const API_BASE_URL = isServer
  ? process.env.BACKEND_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000"
  : process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const env = {
  APP_URL,
  API_BASE_URL,
} as const;
