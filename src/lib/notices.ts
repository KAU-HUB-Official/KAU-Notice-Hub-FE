import { Notice } from "@/lib/types";

export const ALL_SOURCES = "__ALL_SOURCES__";
export const ALL_DEPARTMENTS = "__ALL_DEPARTMENTS__";
export const ALL_CATEGORIES = "__ALL_CATEGORIES__";
export const ALL_AUDIENCE_GROUPS = "__ALL_AUDIENCES__";
export const ALL_SOURCE_GROUPS = "__ALL_SOURCE_GROUPS__";
export const DEPARTMENT_AUDIENCE_GROUP = "학부 재학생(학과/전공별)";

export const AUDIENCE_GROUP_ORDER = [
  "전 구성원 공통",
  DEPARTMENT_AUDIENCE_GROUP,
  "신입생·저학년",
  "재학생 비교과·글로벌 프로그램",
  "취업·창업 준비생",
  "대학원생",
  "평생·전문교육원",
  "그 외"
] as const;

export const SOURCE_GROUP_ORDER = [
  "일반",
  "학사",
  "장학/대출",
  "입찰",
  "행사",
  "공과대",
  "AI융합대",
  "항공경영대",
  "그 외 학부",
  "새내기성공센터",
  "드림칼리지디자인",
  "국제교류",
  "첨단분야 부트캠프",
  "산학협력",
  "교수학습센터",
  "대학일자리플러스센터",
  "학과 취업공지",
  "대학원",
  "생활관",
  "인권센터",
  "학술정보관",
  "LMS",
  "입학처",
  "박물관",
  "그 외"
] as const;

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
  ALL_DEPARTMENTS.toLowerCase(),
  ALL_CATEGORIES.toLowerCase(),
  ALL_AUDIENCE_GROUPS.toLowerCase(),
  ALL_SOURCE_GROUPS.toLowerCase(),
  "all",
  "전체",
  "전체출처",
  "전체 출처",
  "전체홈페이지",
  "전체 홈페이지",
  "전체중분류",
  "전체 중분류",
  "전체그룹",
  "전체 그룹",
  "전체부서",
  "전체 부서",
  "전체분류",
  "전체 분류"
]);

const SEARCH_STOP_WORDS = new Set([
  "공지",
  "공지사항",
  "정보",
  "내용",
  "관련",
  "문의",
  "질문",
  "알려줘",
  "알려주세요",
  "보여줘",
  "보여주세요",
  "뭐야",
  "무엇",
  "뭔지",
  "정리",
  "요약",
  "최신",
  "최근",
  "확인",
  "안내",
  "좀",
  "해줘",
  "해주세요",
  "please",
  "show",
  "find",
  "about",
  "latest",
  "info"
]);

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeToken(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

function compact(value: string): string {
  return value.replace(/\s+/g, "");
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

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function orderedByKnownGroups(values: string[], order: readonly string[]): string[] {
  const known = values
    .filter((value) => order.includes(value))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const unknown = values
    .filter((value) => !order.includes(value))
    .sort((a, b) => a.localeCompare(b, "ko"));

  return [...known, ...unknown];
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

function normalizeSourceInput(source?: string | string[]): string[] {
  if (Array.isArray(source)) {
    return uniquePreserveOrder(
      source
        .map((item) => normalizeFacetValue(item))
        .filter((item): item is string => Boolean(item))
    );
  }

  const normalized = normalizeFacetValue(source);
  return normalized ? [normalized] : [];
}

function sourceText(sources: string[]): string {
  return sources.join(" ");
}

export function extractSearchTerms(input?: string): string[] {
  const normalizedInput = normalizeWhitespace(input ?? "");
  if (!normalizedInput) {
    return [];
  }

  const rawTokens = normalizedInput
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter(Boolean);

  if (rawTokens.length === 0) {
    return [];
  }

  const significant = rawTokens.filter((token) => {
    if (SEARCH_STOP_WORDS.has(token)) {
      return false;
    }

    // 숫자가 아닌 한 글자 토큰은 검색 노이즈가 되기 쉬워 제외한다.
    if (token.length === 1 && !/^\d+$/.test(token)) {
      return false;
    }

    return true;
  });

  const selected = significant.length > 0 ? significant : rawTokens;
  return uniquePreserveOrder(selected);
}

export function normalizeFacetValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return undefined;
  }

  if (EMPTY_TOKENS.has(normalized.toLowerCase())) {
    return undefined;
  }

  return normalized;
}

export function normalizeFilterValue(value: unknown): string | undefined {
  const normalized = normalizeFacetValue(value);
  if (!normalized) {
    return undefined;
  }

  if (ALL_FILTER_TOKENS.has(normalizeToken(normalized))) {
    return undefined;
  }

  return normalized;
}

export function normalizeFilterValues(value: unknown): string[] {
  const rawValues = Array.isArray(value) ? value : [value];
  const normalizedValues = rawValues.flatMap((item) => {
    if (typeof item !== "string") {
      return [];
    }

    return item
      .split(",")
      .map((part) => normalizeFilterValue(part))
      .filter((part): part is string => Boolean(part));
  });

  return uniquePreserveOrder(normalizedValues);
}

export function shouldUseSourceFilter(audienceGroup?: string): boolean {
  const normalizedAudience = normalizeFilterValue(audienceGroup);
  return (
    normalizedAudience === DEPARTMENT_AUDIENCE_GROUP ||
    normalizedAudience === "대학원생" ||
    normalizedAudience === "평생·전문교육원"
  );
}

function uniqueSorted(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort((a, b) => a.localeCompare(b, "ko"));
}

export function classifySourceToAudience(source?: string | string[]): string {
  const sources = normalizeSourceInput(source);
  if (sources.length === 0) {
    return "그 외";
  }

  const text = sourceText(sources);

  if (includesAny(text, ["신소재공학과 취업공지", "대학일자리플러스센터"])) {
    return "취업·창업 준비생";
  }

  if (includesAny(text, ["드림칼리지디자인", "새내기성공센터"])) {
    return "신입생·저학년";
  }

  if (includesAny(text, ["국제교류처", "부트캠프사업단", "산학협력단", "교수학습센터"])) {
    return "재학생 비교과·글로벌 프로그램";
  }

  if (includesAny(text, ["대학원", "정책대학원", "경영대학원"])) {
    return "대학원생";
  }

  if (
    includesAny(text, [
      "평생교육원",
      "비행교육원",
      "항공교통관제교육원",
      "항공기술교육원",
      "항공안전교육원"
    ])
  ) {
    return "평생·전문교육원";
  }

  if (
    includesAny(text, [
      "학과",
      "학부",
      "전공",
      "공과대학",
      "항공·경영대학",
      "항공경영대학",
      "AI융합대학",
      "인문자연학부",
      "자유전공학부"
    ])
  ) {
    return "학부 재학생(학과/전공별)";
  }

  if (sources.some((item) => item === "한국항공대학교 공식 홈페이지")) {
    return "전 구성원 공통";
  }

  return "그 외";
}

export function classifyNoticeAudience(notice: Pick<Notice, "source" | "sources">): string {
  return classifySourceToAudience(getNoticeSourceNames(notice));
}

function classifyCommonNoticeGroup(notice: Pick<Notice, "category" | "title">): string {
  const value = `${normalizeFacetValue(notice.category) ?? ""} ${notice.title ?? ""}`;

  if (includesAny(value, ["입찰"])) {
    return "입찰";
  }

  if (includesAny(value, ["학사", "수강", "졸업", "성적", "등록"])) {
    return "학사";
  }

  if (includesAny(value, ["장학", "대출", "국가근로"])) {
    return "장학/대출";
  }

  if (includesAny(value, ["행사", "특강", "설명회", "세미나"])) {
    return "행사";
  }

  return "일반";
}

function classifyCollegeGroups(sources: string[]): string[] {
  const groups = new Set<string>();

  for (const source of sources) {
    if (
      includesAny(source, [
        "공과대학",
        "항공우주공학",
        "기계항공공학",
        "항공우주및기계공학",
        "항공공학전공",
        "기계공학전공",
        "항공MRO전공",
        "우주공학전공",
        "신소재공학과 학부",
        "우주항공신소재전공",
        "반도체신소재전공"
      ])
    ) {
      groups.add("공과대");
      continue;
    }

    if (
      includesAny(source, [
        "AI융합대학",
        "AI융합ICT전공",
        "AI자율주행시스템공학과",
        "인공지능전공",
        "소프트웨어학과",
        "컴퓨터공학",
        "전기전자공학",
        "전자및항공전자전공",
        "항공전자정보공학부",
        "반도체시스템전공",
        "스마트드론공학과"
      ])
    ) {
      groups.add("AI융합대");
      continue;
    }

    if (
      includesAny(source, [
        "항공·경영대학",
        "항공경영대학",
        "항공경영",
        "경영학",
        "경영전공",
        "항공교통물류학부",
        "항공교통전공",
        "물류전공",
        "항공운항학과"
      ])
    ) {
      groups.add("항공경영대");
      continue;
    }

    if (includesAny(source, ["인문자연학부", "자유전공학부"])) {
      groups.add("그 외 학부");
    }
  }

  return orderedByKnownGroups([...groups], SOURCE_GROUP_ORDER);
}

export function classifyNoticeSourceGroups(
  notice: Pick<Notice, "source" | "sources" | "category" | "title">
): string[] {
  const sources = getNoticeSourceNames(notice);
  const audience = classifyNoticeAudience(notice);
  const text = sourceText(sources);

  if (audience === "전 구성원 공통") {
    return [classifyCommonNoticeGroup(notice)];
  }

  if (audience === DEPARTMENT_AUDIENCE_GROUP) {
    const groups = classifyCollegeGroups(sources);
    return groups.length > 0 ? groups : ["그 외 학부"];
  }

  if (audience === "신입생·저학년") {
    if (includesAny(text, ["새내기성공센터"])) {
      return ["새내기성공센터"];
    }
    if (includesAny(text, ["드림칼리지디자인"])) {
      return ["드림칼리지디자인"];
    }
  }

  if (audience === "재학생 비교과·글로벌 프로그램") {
    const groups = new Set<string>();
    if (includesAny(text, ["국제교류처"])) {
      groups.add("국제교류");
    }
    if (includesAny(text, ["부트캠프사업단"])) {
      groups.add("첨단분야 부트캠프");
    }
    if (includesAny(text, ["산학협력단"])) {
      groups.add("산학협력");
    }
    if (includesAny(text, ["교수학습센터"])) {
      groups.add("교수학습센터");
    }

    return groups.size > 0 ? orderedByKnownGroups([...groups], SOURCE_GROUP_ORDER) : ["그 외"];
  }

  if (audience === "취업·창업 준비생") {
    const groups = new Set<string>();
    if (includesAny(text, ["대학일자리플러스센터"])) {
      groups.add("대학일자리플러스센터");
    }
    if (includesAny(text, ["신소재공학과 취업공지"])) {
      groups.add("학과 취업공지");
    }

    return orderedByKnownGroups([...groups], SOURCE_GROUP_ORDER);
  }

  if (audience === "대학원생") {
    return [];
  }

  if (audience === "평생·전문교육원") {
    return [];
  }

  if (audience === "그 외") {
    const groups = new Set<string>();
    if (includesAny(text, ["생활관"])) {
      groups.add("생활관");
    }
    if (includesAny(text, ["인권센터"])) {
      groups.add("인권센터");
    }
    if (includesAny(text, ["학술정보관"])) {
      groups.add("학술정보관");
    }
    if (includesAny(text, ["LMS"])) {
      groups.add("LMS");
    }
    if (includesAny(text, ["입학처"])) {
      groups.add("입학처");
    }
    if (includesAny(text, ["항공우주박물관"])) {
      groups.add("박물관");
    }

    return orderedByKnownGroups([...groups], SOURCE_GROUP_ORDER);
  }

  return ["그 외"];
}

export function classifyNoticeSourceGroup(
  notice: Pick<Notice, "source" | "sources" | "category" | "title">
): string | undefined {
  return classifyNoticeSourceGroups(notice)[0];
}

export function getAllAudienceGroups(notices: Notice[]): string[] {
  const present = new Set<string>();
  for (const notice of notices) {
    present.add(classifyNoticeAudience(notice));
  }

  return AUDIENCE_GROUP_ORDER.filter((group) => present.has(group));
}

export function filterByAudienceGroup(notices: Notice[], audienceGroup?: string): Notice[] {
  const normalizedAudience = normalizeFilterValue(audienceGroup);
  if (!normalizedAudience) {
    return notices;
  }

  return notices.filter((notice) => classifyNoticeAudience(notice) === normalizedAudience);
}

export function getAllSourceGroups(notices: Notice[]): string[] {
  const present = new Set<string>();
  for (const notice of notices) {
    for (const group of classifyNoticeSourceGroups(notice)) {
      present.add(group);
    }
  }

  return orderedByKnownGroups([...present], SOURCE_GROUP_ORDER);
}

export function filterBySourceGroup(notices: Notice[], sourceGroup?: string): Notice[] {
  const normalizedSourceGroup = normalizeFilterValue(sourceGroup);
  if (!normalizedSourceGroup) {
    return notices;
  }

  return notices.filter((notice) =>
    classifyNoticeSourceGroups(notice).includes(normalizedSourceGroup)
  );
}

function getFacetSourceNames(notice: Notice, audienceGroup?: string, sourceGroup?: string): string[] {
  const normalizedAudience = normalizeFilterValue(audienceGroup);
  const normalizedSourceGroup = normalizeFilterValue(sourceGroup);
  const sources = getNoticeSourceNames(notice);

  const scopedSources = sources.filter((source) => {
    const scopedNotice = {
      ...notice,
      source,
      sources: [source]
    };

    if (normalizedAudience && classifyNoticeAudience(scopedNotice) !== normalizedAudience) {
      return false;
    }

    if (
      normalizedSourceGroup &&
      !classifyNoticeSourceGroups(scopedNotice).includes(normalizedSourceGroup)
    ) {
      return false;
    }

    return true;
  });

  return scopedSources.length > 0 ? scopedSources : sources;
}

export function getAllSources(notices: Notice[], audienceGroup?: string, sourceGroup?: string): string[] {
  return uniqueSorted(notices.flatMap((notice) => getFacetSourceNames(notice, audienceGroup, sourceGroup)));
}

export function getAllDepartments(notices: Notice[]): string[] {
  return uniqueSorted(notices.map((notice) => normalizeFacetValue(notice.department)));
}

function isCategoryShapeUseful(value: string): boolean {
  if (value.length < 2 || value.length > 24) {
    return false;
  }

  if (/[<>]/.test(value)) {
    return false;
  }

  return true;
}

export function getCleanCategories(notices: Notice[]): string[] {
  const categories = notices
    .map((notice) => normalizeFacetValue(notice.category))
    .filter((value): value is string => Boolean(value));

  if (categories.length === 0) {
    return [];
  }

  const countMap = new Map<string, number>();
  for (const category of categories) {
    countMap.set(category, (countMap.get(category) ?? 0) + 1);
  }

  const entries = [...countMap.entries()];
  const oneOffCount = entries.filter(([, count]) => count === 1).length;
  const oneOffRatio = oneOffCount / entries.length;

  const cleaned = entries
    .filter(([category, count]) => count >= 2 && isCategoryShapeUseful(category))
    .map(([category]) => category)
    .sort((a, b) => a.localeCompare(b, "ko"));

  if (cleaned.length === 0) {
    return [];
  }

  // 노이즈가 많으면 category 자체를 숨겨 source+검색 탐색에 집중한다.
  if (entries.length > 18 || oneOffRatio > 0.35) {
    return [];
  }

  return cleaned.slice(0, 12);
}

function buildSearchText(notice: Notice): string {
  return [
    notice.title,
    notice.summary,
    notice.content,
    classifyNoticeAudience(notice),
    ...classifyNoticeSourceGroups(notice),
    normalizeFacetValue(notice.source),
    normalizeFacetValue(notice.department),
    normalizeFacetValue(notice.category),
    ...getNoticeSourceNames(notice),
    ...notice.tags
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n")
    .toLowerCase();
}

export interface NoticeFilterInput {
  q?: string;
  source?: string;
  department?: string;
  category?: string;
}

export function filterNotices(notices: Notice[], input: NoticeFilterInput): Notice[] {
  const sourceFilter = normalizeFilterValue(input.source);
  const departmentFilter = normalizeFilterValue(input.department);
  const categoryFilter = normalizeFilterValue(input.category);
  const terms = extractSearchTerms(input.q);
  const normalizedQuery = normalizeWhitespace(input.q ?? "").toLowerCase();
  const compactQuery = compact(normalizedQuery);

  return notices.filter((notice) => {
    const sourceNames = getNoticeSourceNames(notice);
    const department = normalizeFacetValue(notice.department);
    const category = normalizeFacetValue(notice.category);

    if (sourceFilter && !sourceNames.includes(sourceFilter)) {
      return false;
    }

    if (departmentFilter && department !== departmentFilter) {
      return false;
    }

    if (categoryFilter && category !== categoryFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchable = buildSearchText(notice);
    if (searchable.includes(normalizedQuery)) {
      return true;
    }

    const compactSearchable = compact(searchable);
    if (compactQuery && compactSearchable.includes(compactQuery)) {
      return true;
    }

    if (terms.length === 0) {
      return false;
    }

    const matchedCount = terms.filter((term) => {
      if (searchable.includes(term)) {
        return true;
      }

      const compactTerm = compact(term);
      return compactTerm.length > 0 && compactSearchable.includes(compactTerm);
    }).length;

    const requiredMatches = Math.min(2, terms.length);
    return matchedCount >= requiredMatches;
  });
}

export function formatSourceLabel(source: string): string {
  const normalized = normalizeWhitespace(source);
  const compact = normalized.replace(/^한국항공대학교\s*/, "");
  return compact || normalized;
}
