import { NextResponse } from "next/server";

import { ChatRequestBody } from "@/lib/types";
import { BackendApiError } from "@/server/notices/backend-notice-service";
import { noticeService } from "@/server/notices";

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

    const upstream = await noticeService.askChatStream(
      {
        question,
        history: body.history,
        audienceGroup: body.audienceGroup,
        sourceGroup: body.sourceGroup,
        source: body.source,
        category: body.category,
        department: body.department
      },
      request.signal
    );

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });
  } catch (error) {
    console.error("POST /api/chat/stream failed:", error);

    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { error: error.message, detail: error.detail },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "챗봇 응답을 생성하지 못했습니다." },
      { status: 500 }
    );
  }
}
