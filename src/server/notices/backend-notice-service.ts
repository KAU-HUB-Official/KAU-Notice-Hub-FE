import {
  ChatAnswer,
  ChatRequestBody,
  Notice,
  NoticeFacets,
  NoticeListResult,
  NoticeQuery
} from "@/lib/types";

const DEFAULT_BACKEND_API_BASE_URL = "http://localhost:8000";

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
}
