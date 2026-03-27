/**
 * GET /api/logs
 *
 * Returns all prompt logs for AI transparency.
 * Each log contains the full prompt, response, and token usage from every audit.
 */

import { NextResponse } from "next/server";
import { getAllPromptLogs } from "@/lib/logger";

export async function GET() {
  try {
    const logs = await getAllPromptLogs();
    return NextResponse.json(logs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
