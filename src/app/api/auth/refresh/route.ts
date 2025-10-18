import { jsonError } from "@/lib/errors";

/**
 * Optional placeholder for refresh-token logic
 * (Currently not implemented)
 */
export async function GET() {
  return jsonError(501, "Token refresh not implemented yet");
}
