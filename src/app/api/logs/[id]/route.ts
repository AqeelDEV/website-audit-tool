/**
 * GET /api/logs/:id
 *
 * Returns a single prompt log by ID for detailed inspection.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPromptLogById } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const log = await getPromptLogById(params.id);
    if (!log) {
      return NextResponse.json(
        { error: `Log not found: ${params.id}` },
        { status: 404 }
      );
    }
    return NextResponse.json(log);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve log";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
