import { NextResponse } from "next/server";
import { getStats } from "@/lib/stats";

// Always compute fresh — this reads live message/event data and must never
// be statically prerendered at build time (no DATABASE_URL is available
// during `next build`, only at request time in a real deployment).
export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getStats();
  return NextResponse.json(stats);
}
