import { Notice } from "@/lib/types";

export const ALL_SOURCES = "__ALL_SOURCES__";
export const ALL_AUDIENCE_GROUPS = "__ALL_AUDIENCES__";
export const ALL_SOURCE_GROUPS = "__ALL_SOURCE_GROUPS__";
export const DEPARTMENT_AUDIENCE_GROUP = "학부 재학생(학과/전공별)";

const EMPTY_TOKENS = new Set([
  "",
  "-",
  "_",
  "n/a",
  "na",
  "none",
  "null",
  "undefined",
  "미분류"
]);

const ALL_FILTER_TOKENS = new Set([
  ALL_SOURCES.toLowerCase(),
  ALL_AUDIENCE_GROUPS.toLowerCase(),
  ALL_SOURCE_GROUPS.toLowerCase(),
  "all",
  "전체",
  "전체홈페이지",
  "전체 홈페이지",
  "전체중분류",
  "전체 중분류",
  "전체대상",
  "전체 대상"
]);

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeToken(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
}

export function normalizeFacetValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = normalizeWhitespace(value);
  if (!normalized || EMPTY_TOKENS.has(normalized.toLowerCase())) {
    return undefined;
  }

  return normalized;
}

export function normalizeFilterValue(value: unknown): string | undefined {
  const normalized = normalizeFacetValue(value);
  if (!normalized || ALL_FILTER_TOKENS.has(normalizeToken(normalized))) {
    return undefined;
  }

  return normalized;
}

export function getNoticeSourceNames(notice: Pick<Notice, "source" | "sources">): string[] {
  const fromList = Array.isArray(notice.sources)
    ? notice.sources
        .map((source) => normalizeFacetValue(source))
        .filter((source): source is string => Boolean(source))
    : [];

  const fallback = normalizeFacetValue(notice.source);
  return uniquePreserveOrder(fallback ? [...fromList, fallback] : fromList);
}

export function shouldUseSourceFilter(audienceGroup?: string): boolean {
  const normalizedAudience = normalizeFilterValue(audienceGroup);
  return (
    normalizedAudience === DEPARTMENT_AUDIENCE_GROUP ||
    normalizedAudience === "대학원생" ||
    normalizedAudience === "평생·전문교육원"
  );
}

export function formatSourceLabel(source: string): string {
  const normalized = normalizeWhitespace(source);
  const compact = normalized.replace(/^한국항공대학교\s*/, "");
  return compact || normalized;
}
