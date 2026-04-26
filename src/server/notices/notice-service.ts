import {
  extractSearchTerms,
  classifyNoticeAudience,
  classifyNoticeSourceGroup,
  classifyNoticeSourceGroups,
  filterByAudienceGroup,
  filterBySourceGroup,
  filterNotices,
  getAllAudienceGroups,
  getAllDepartments,
  getAllSourceGroups,
  getAllSources,
  getCleanCategories,
  getNoticeSourceNames,
  normalizeFilterValue,
  normalizeFacetValue,
  shouldUseSourceFilter
} from "@/lib/notices";
import { Notice, NoticeFacets, NoticeListResult, NoticeQuery } from "@/lib/types";

import { NoticeRepository } from "./notice-repository";

interface RankedNotice {
  notice: Notice;
  score: number;
}

function toComparableDate(value?: string): number {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeTerm(value: string): string {
  return value.trim().toLowerCase();
}

function buildSearchText(notice: Notice): string {
  return [
    notice.title,
    notice.summary,
    notice.content,
    classifyNoticeAudience(notice),
    ...classifyNoticeSourceGroups(notice),
    normalizeFacetValue(notice.source),
    normalizeFacetValue(notice.category),
    normalizeFacetValue(notice.department),
    ...getNoticeSourceNames(notice),
    ...notice.tags
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n")
    .toLowerCase();
}

function scoreNotice(notice: Notice, terms: string[]): number {
  if (terms.length === 0) {
    return 0;
  }

  const title = notice.title.toLowerCase();
  const summary = (notice.summary ?? "").toLowerCase();
  const content = notice.content.toLowerCase();
  const source = (normalizeFacetValue(notice.source) ?? "").toLowerCase();
  const category = (normalizeFacetValue(notice.category) ?? "").toLowerCase();
  const tags = notice.tags.join(" ").toLowerCase();
  const fullText = buildSearchText(notice);

  let score = 0;

  for (const term of terms) {
    if (!fullText.includes(term)) {
      continue;
    }

    score += 1;

    if (title.includes(term)) {
      score += 7;
    }
    if (summary.includes(term)) {
      score += 4;
    }
    if (tags.includes(term)) {
      score += 3;
    }
    if (source.includes(term) || category.includes(term)) {
      score += 2;
    }
    if (content.includes(term)) {
      score += 1;
    }
  }

  return score;
}

function clampPage(value?: number): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function clampPageSize(value?: number): number {
  if (!value || Number.isNaN(value)) {
    return 20;
  }

  const size = Math.floor(value);
  if (size < 1) {
    return 1;
  }

  if (size > 100) {
    return 100;
  }

  return size;
}

export class NoticeService {
  constructor(private readonly repository: NoticeRepository) {}

  private enrichNotice(notice: Notice): Notice {
    const sourceGroups = classifyNoticeSourceGroups(notice);

    return {
      ...notice,
      audienceGroup: classifyNoticeAudience(notice),
      sourceGroup: classifyNoticeSourceGroup(notice),
      sourceGroups
    };
  }

  async listNotices(query: NoticeQuery): Promise<NoticeListResult> {
    const notices = await this.repository.listAll();
    const page = clampPage(query.page);
    const pageSize = clampPageSize(query.pageSize);
    const audienceFiltered = filterByAudienceGroup(notices, query.audienceGroup);
    const sourceGroups = getAllSourceGroups(audienceFiltered);
    const normalizedSourceGroup = normalizeFilterValue(query.sourceGroup);
    const effectiveSourceGroup =
      normalizedSourceGroup && sourceGroups.includes(normalizedSourceGroup)
        ? normalizedSourceGroup
        : undefined;
    const sourceGroupFiltered = filterBySourceGroup(audienceFiltered, effectiveSourceGroup);
    const sourceFilterEnabled = shouldUseSourceFilter(query.audienceGroup);

    const facets: NoticeFacets = {
      audienceGroups: getAllAudienceGroups(notices),
      sourceGroups,
      sources: sourceFilterEnabled
        ? getAllSources(sourceGroupFiltered, query.audienceGroup, effectiveSourceGroup)
        : [],
      categories: getCleanCategories(sourceGroupFiltered),
      departments: getAllDepartments(sourceGroupFiltered)
    };

    const filtered = filterNotices(sourceGroupFiltered, {
      q: query.q,
      source: sourceFilterEnabled ? query.source : undefined,
      category: normalizeFilterValue(query.category),
      department: normalizeFilterValue(query.department)
    });

    const searchTerms = extractSearchTerms(query.q).map(normalizeTerm);

    const ranked: RankedNotice[] = filtered.map((notice) => ({
      notice,
      score: scoreNotice(notice, searchTerms)
    }));

    ranked.sort((a, b) => {
      if (searchTerms.length > 0 && b.score !== a.score) {
        return b.score - a.score;
      }

      const dateDiff = toComparableDate(b.notice.date) - toComparableDate(a.notice.date);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return a.notice.title.localeCompare(b.notice.title, "ko");
    });

    const total = ranked.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: ranked.slice(start, end).map((item) => this.enrichNotice(item.notice)),
      total,
      page: currentPage,
      pageSize,
      totalPages,
      facets
    };
  }

  async getNoticeById(id: string): Promise<Notice | null> {
    const notice = await this.repository.getById(id);
    if (!notice) {
      return null;
    }

    return {
      ...this.enrichNotice(notice)
    };
  }

  async findRelevantNotices(question: string, limit = 5, filters: Omit<NoticeQuery, "page" | "pageSize"> = {}): Promise<Notice[]> {
    const search = await this.listNotices({
      ...filters,
      q: question,
      page: 1,
      pageSize: limit
    });

    if (search.items.length > 0) {
      return search.items;
    }

    const latest = await this.listNotices({
      ...filters,
      page: 1,
      pageSize: limit
    });
    return latest.items;
  }
}
