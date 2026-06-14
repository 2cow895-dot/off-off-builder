import { NextRequest, NextResponse } from "next/server";
import { runTriage } from "@/lib/triage-engine";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText } = body;

    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 5) {
      return NextResponse.json(
        { error: "아이디어를 5자 이상 입력해 주세요." },
        { status: 400 }
      );
    }

    const result = runTriage({
      sessionId: randomUUID(),
      rawText: rawText.trim(),
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
