import { NextRequest, NextResponse } from "next/server";

import { noticeService } from "@/server/notices";

export const dynamic = "force-dynamic";

function parseNumber(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const result = await noticeService.listNotices({
      q: searchParams.get("q") ?? undefined,
      audienceGroup: searchParams.get("audience") ?? undefined,
      sourceGroup: searchParams.get("group") ?? searchParams.get("sourceGroup") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      department: searchParams.get("department") ?? undefined,
      page: parseNumber(searchParams.get("page"), 1),
      pageSize: parseNumber(searchParams.get("pageSize"), 20)
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/notices failed:", error);

    return NextResponse.json(
      { error: "공지 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
