import { NextRequest, NextResponse } from "next/server";
import { getAskPresets } from "@/content";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = body.question || "";
    const presetsData = getAskPresets();
    
    const matched = presetsData.presets.find(
      (p) => p.question.toLowerCase() === question.toLowerCase()
    ) || presetsData.presets[0];

    return NextResponse.json(
      {
        question: matched.question,
        answer: matched.answer,
        status: "200 OK",
        cached: false,
      },
      {
        headers: {
          "X-Cache": "MISS",
          "X-RateLimit-Remaining": "4",
          "X-Response-Time": "840 ms",
        },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
