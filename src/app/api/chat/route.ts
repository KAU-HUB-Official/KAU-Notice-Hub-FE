import { NextResponse } from "next/server";

import { ChatRequestBody } from "@/lib/types";
import { askNoticeQuestion } from "@/server/ai/chat-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChatRequestBody>;
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "question 필드는 필수입니다." },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: "질문은 500자 이하로 입력해주세요." },
        { status: 400 }
      );
    }

    const answer = await askNoticeQuestion({
      question,
      filters: {
        audienceGroup: body.audienceGroup,
        sourceGroup: body.sourceGroup,
        source: body.source,
        category: body.category,
        department: body.department
      }
    });

    return NextResponse.json(answer);
  } catch (error) {
    console.error("POST /api/chat failed:", error);

    return NextResponse.json(
      { error: "챗봇 응답을 생성하지 못했습니다." },
      { status: 500 }
    );
  }
}
