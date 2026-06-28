import {
  ChatAnswer,
  ChatRequestBody,
  Notice,
  NoticeFacets,
  NoticeListResult,
  NoticeNavigation,
  NoticeNavigationItem,
  NoticeQuery
} from "@/lib/types";

import { headers as nextHeaders } from "next/headers";

const DEFAULT_BACKEND_API_BASE_URL = "http://localhost:8000";
const NOTICE_NAVIGATION_PAGE_SIZE = 200;

export class BackendApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

function getBackendApiBaseUrl(): string {
  const rawBaseUrl =
    process.env.NOTICE_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_BACKEND_API_BASE_URL;

  return rawBaseUrl.replace(/\/+$/, "");
}

// BFF는 백엔드를 서버사이드 fetch로 호출하므로, 백엔드 입장에선 모든 요청이 Vercel
// IP 하나로 보인다. per-IP 레이트리밋이 동작하려면 실제 브라우저 IP를 전달해야 한다.
// NOTICE_API_INTERNAL_TOKEN(백엔드 INTERNAL_PROXY_TOKEN과 동일)이 설정된 경우에만,
// 들어온 요청의 client IP를 X-Client-IP로, 토큰을 X-Internal-Token으로 함께 보낸다.
// 토큰 미설정 시 헤더를 만들지 않으므로 dynamic 렌더 opt-in도 일어나지 않는다.
function buildForwardHeaders(): Record<string, string> {
  const token = process.env.NOTICE_API_INTERNAL_TOKEN;
  if (!token) {
    return {};
  }

  try {
    const incoming = nextHeaders();
    const forwardedFor = incoming.get("x-forwarded-for");
    const clientIp =
      forwardedFor?.split(",")[0]?.trim() || incoming.get("x-real-ip")?.trim();
    if (!clientIp) {
      return {};
    }
    return { "X-Internal-Token": token, "X-Client-IP": clientIp };
  } catch {
    // 요청 스코프 밖(빌드/정적 생성 등)에서는 헤더를 읽을 수 없다 → 전달 생략.
    return {};
  }
}

function appendStringParam(params: URLSearchParams, key: string, value?: string): void {
  const trimmed = value?.trim();
  if (trimmed) {
    params.set(key, trimmed);
  }
}

function appendNumberParam(params: URLSearchParams, key: string, value?: number): void {
  if (typeof value === "number" && Number.isFinite(value)) {
    params.set(key, String(value));
  }
}

function buildNoticeQueryParams(query: NoticeQuery): URLSearchParams {
  const params = new URLSearchParams();

  appendStringParam(params, "q", query.q);
  appendStringParam(params, "audience", query.audienceGroup);
  appendStringParam(params, "group", query.sourceGroup);
  appendStringParam(params, "source", query.source);
  appendNumberParam(params, "page", query.page);
  appendNumberParam(params, "pageSize", query.pageSize);

  return params;
}

function normalizeFacets(facets?: Partial<NoticeFacets>): NoticeFacets {
  return {
    audienceGroups: Array.isArray(facets?.audienceGroups) ? facets.audienceGroups : [],
    sourceGroups: Array.isArray(facets?.sourceGroups) ? facets.sourceGroups : [],
    sources: Array.isArray(facets?.sources) ? facets.sources : [],
    categories: Array.isArray(facets?.categories) ? facets.categories : []
  };
}

function normalizeNotice(notice: Notice): Notice {
  return {
    ...notice,
    tags: Array.isArray(notice.tags) ? notice.tags : [],
    attachments: Array.isArray(notice.attachments) ? notice.attachments : [],
    sources: Array.isArray(notice.sources) ? notice.sources : undefined
  };
}

function normalizeNoticeListResult(result: NoticeListResult): NoticeListResult {
  return {
    items: Array.isArray(result.items) ? result.items.map(normalizeNotice) : [],
    total: Number.isFinite(result.total) ? result.total : 0,
    page: Number.isFinite(result.page) ? result.page : 1,
    pageSize: Number.isFinite(result.pageSize) ? result.pageSize : 20,
    totalPages: Number.isFinite(result.totalPages) ? result.totalPages : 1,
    facets: normalizeFacets(result.facets)
  };
}

function toNoticeNavigationItem(notice: Notice): NoticeNavigationItem {
  return {
    id: notice.id,
    title: notice.title,
    date: notice.date
  };
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function getErrorMessage(payload: unknown, fallback: string): { message: string; detail?: string } {
  if (!payload || typeof payload !== "object") {
    return { message: fallback };
  }

  const error = "error" in payload ? payload.error : undefined;
  const detail = "detail" in payload ? payload.detail : undefined;

  return {
    message: typeof error === "string" && error.trim() ? error : fallback,
    detail: typeof detail === "string" && detail.trim() ? detail : undefined
  };
}

async function requestBackendJson<T>(
  path: string,
  init: RequestInit = {},
  fallbackErrorMessage = "백엔드 API 요청에 실패했습니다."
): Promise<T> {
  const baseUrl = getBackendApiBaseUrl();
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  for (const [key, value] of Object.entries(buildForwardHeaders())) {
    headers.set(key, value);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    const { message, detail } = getErrorMessage(payload, fallbackErrorMessage);
    throw new BackendApiError(message, response.status, detail);
  }

  return payload as T;
}

export class BackendNoticeService {
  async listNotices(query: NoticeQuery): Promise<NoticeListResult> {
    const params = buildNoticeQueryParams(query);
    const queryString = params.toString();
    const path = queryString ? `/api/notices?${queryString}` : "/api/notices";

    const result = await requestBackendJson<NoticeListResult>(
      path,
      {},
      "공지 목록을 불러오지 못했습니다."
    );

    return normalizeNoticeListResult(result);
  }

  async getNoticeById(id: string): Promise<Notice | null> {
    try {
      const notice = await requestBackendJson<Notice>(
        `/api/notices/${encodeURIComponent(id)}`,
        {},
        "공지 상세를 불러오지 못했습니다."
      );

      return normalizeNotice(notice);
    } catch (error) {
      if (error instanceof BackendApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  async getNoticeNavigation(id: string): Promise<NoticeNavigation> {
    let page = 1;
    let totalPages = 1;
    let previousPageLastNotice: Notice | null = null;

    while (page <= totalPages) {
      const result = await this.listNotices({
        page,
        pageSize: NOTICE_NAVIGATION_PAGE_SIZE
      });
      totalPages = Math.max(1, result.totalPages);

      const noticeIndex = result.items.findIndex((notice) => notice.id === id);
      if (noticeIndex !== -1) {
        const previousNotice =
          noticeIndex > 0 ? result.items[noticeIndex - 1] : previousPageLastNotice;
        let nextNotice =
          noticeIndex < result.items.length - 1
            ? result.items[noticeIndex + 1]
            : null;

        if (!nextNotice && page < totalPages) {
          const nextPageResult = await this.listNotices({
            page: page + 1,
            pageSize: NOTICE_NAVIGATION_PAGE_SIZE
          });
          nextNotice = nextPageResult.items[0] ?? null;
        }

        return {
          previous: previousNotice ? toNoticeNavigationItem(previousNotice) : null,
          next: nextNotice ? toNoticeNavigationItem(nextNotice) : null
        };
      }

      previousPageLastNotice =
        result.items.length > 0
          ? result.items[result.items.length - 1]
          : previousPageLastNotice;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return {
      previous: null,
      next: null
    };
  }

  async askChat(body: ChatRequestBody): Promise<ChatAnswer> {
    return requestBackendJson<ChatAnswer>(
      "/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      },
      "챗봇 응답을 생성하지 못했습니다."
    );
  }

  async askChatStream(
    body: ChatRequestBody,
    signal?: AbortSignal
  ): Promise<Response> {
    const baseUrl = getBackendApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...buildForwardHeaders()
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal
    });

    if (!response.ok) {
      const payload = await parseJsonResponse(response);
      const { message, detail } = getErrorMessage(
        payload,
        "챗봇 응답을 생성하지 못했습니다."
      );
      throw new BackendApiError(message, response.status, detail);
    }

    if (!response.body) {
      throw new BackendApiError(
        "챗봇 응답 스트림을 받지 못했습니다.",
        502
      );
    }

    return response;
  }
}
