import { NextResponse } from "next/server";
import { caseAll } from "@/data/liveCase";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** The same validated source used by pages, without a misleading second health fetch. */
export async function GET() {
  const data = await caseAll();
  return NextResponse.json({
    board: { source: data.source, live: data.live, updatedLabel: data.updatedLabel, flavors: data.boards.reduce((count, board) => count + board.flavors.length, 0) },
    feed: { configured: Boolean(process.env.SCOOPLIST_FEED_URL) },
    summary: data.notice,
  }, { headers: { "Cache-Control": "no-store" } });
}
