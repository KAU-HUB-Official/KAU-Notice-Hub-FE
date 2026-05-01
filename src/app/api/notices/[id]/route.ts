import { NextResponse } from "next/server";

import { noticeService } from "@/server/notices";
import { BackendApiError } from "@/server/notices/backend-notice-service";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const id = decodeURIComponent(context.params.id);
    const notice = await noticeService.getNoticeById(id);

    if (!notice) {
      return NextResponse.json({ error: "공지 항목을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(notice);
  } catch (error) {
    console.error("GET /api/notices/[id] failed:", error);

    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { error: error.message, detail: error.detail },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "공지 상세를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
