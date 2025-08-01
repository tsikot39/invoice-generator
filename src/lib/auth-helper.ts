import { getServerSession } from "next-auth";
import { Session } from "next-auth";
import authConfig from "@/lib/auth";

// Unified auth function that works for both pages and API routes
export async function auth(): Promise<Session | null> {
  return await getServerSession(authConfig);
}

// Keep this for backward compatibility
export async function getApiSession(): Promise<Session | null> {
  return await getServerSession(authConfig);
}

export { authConfig };
