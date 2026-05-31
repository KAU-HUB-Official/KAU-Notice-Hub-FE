"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ALL_AUDIENCE_GROUPS, ALL_SOURCE_GROUPS, ALL_SOURCES, shouldUseSourceFilter } from "@/lib/notices";
import { NoticeListResult } from "@/lib/types";

import AudienceNav from "./AudienceNav";
import NoticeList from "./NoticeList";
import NoticeListSkeleton from "./NoticeListSkeleton";
import SearchBar from "./SearchBar";
import SourceGroupFilter from "./SourceGroupFilter";
import SourceNav from "./SourceNav";

const PAGE_SIZE = 15;
const PAGE_WINDOW_SIZE = 1;

export interface NoticeExplorerFilters {
  q: string;
  audienceGroup: string;
  sourceGroup: string;
  source: string;
}

interface NoticeExplorerProps {
  initialData: NoticeListResult;
  initialFilters: NoticeExplorerFilters;
}

function buildApiParams(filters: NoticeExplorerFilters, page: number): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.audienceGroup !== ALL_AUDIENCE_GROUPS) {
    params.set("audience", filters.audienceGroup);
  }

  if (filters.sourceGroup !== ALL_SOURCE_GROUPS) {
    params.set("group", filters.sourceGroup);
  }

  if (shouldUseSourceFilter(filters.audienceGroup) && filters.source !== ALL_SOURCES) {
    params.set("source", filters.source);
  }

  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));

  return params;
}

function buildPageQuery(filters: NoticeExplorerFilters, page: number): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.audienceGroup !== ALL_AUDIENCE_GROUPS) {
    params.set("audience", filters.audienceGroup);
  }

  if (filters.sourceGroup !== ALL_SOURCE_GROUPS) {
    params.set("group", filters.sourceGroup);
  }

  if (shouldUseSourceFilter(filters.audienceGroup) && filters.source !== ALL_SOURCES) {
    params.set("source", filters.source);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return params;
}

type PaginationItem = number | "ellipsis";

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageSet = new Set<number>([1, totalPages]);

  for (
    let pageNumber = currentPage - PAGE_WINDOW_SIZE;
    pageNumber <= currentPage + PAGE_WINDOW_SIZE;
    pageNumber += 1
  ) {
    if (pageNumber > 1 && pageNumber < totalPages) {
      pageSet.add(pageNumber);
    }
  }

  if (currentPage <= 4) {
    [2, 3, 4, 5].forEach((pageNumber) => pageSet.add(pageNumber));
  }

  if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach(
      (pageNumber) => {
        if (pageNumber > 1) {
          pageSet.add(pageNumber);
        }
      }
    );
  }

  const pages = Array.from(pageSet).sort((first, second) => first - second);
  const items: PaginationItem[] = [];

  pages.forEach((pageNumber, index) => {
    const previousPage = pages[index - 1];
    if (previousPage && pageNumber - previousPage > 1) {
      items.push("ellipsis");
    }
    items.push(pageNumber);
  });

  return items;
}

export default function NoticeExplorer({ initialData, initialFilters }: NoticeExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchInput, setSearchInput] = useState(initialFilters.q);
  const [filters, setFilters] = useState<NoticeExplorerFilters>(initialFilters);
  const [page, setPage] = useState(initialData.page);
  const [data, setData] = useState<NoticeListResult>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const skipFetchOnMount = useRef(true);
  const skipSyncOnMount = useRef(true);

  useEffect(() => {
    if (skipFetchOnMount.current) {
      skipFetchOnMount.current = false;
      return;
    }

    const controller = new AbortController();

    async function fetchNotices() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/notices?${buildApiParams(filters, page).toString()}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`공지 조회 실패 (${response.status})`);
        }

        const result = (await response.json()) as NoticeListResult;
        setData(result);

        if (result.page !== page) {
          setPage(result.page);
        }
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(fetchError);
        setError("공지 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchNotices();

    return () => controller.abort();
  }, [filters, page]);

  useEffect(() => {
    if (skipSyncOnMount.current) {
      skipSyncOnMount.current = false;
      return;
    }

    const query = buildPageQuery(filters, page).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [filters, page, pathname, router]);

  function handleSourceSelect(nextSource: string) {
    if (!shouldUseSourceFilter(filters.audienceGroup)) {
      return;
    }

    setPage(1);
    setFilters((prev) => ({
      ...prev,
      source: nextSource === ALL_SOURCES || prev.source === nextSource ? ALL_SOURCES : nextSource
    }));
  }

  function handleAudienceSelect(nextAudience: string) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      audienceGroup: nextAudience,
      sourceGroup: ALL_SOURCE_GROUPS,
      source: ALL_SOURCES
    }));
  }

  function handleSourceGroupChange(nextSourceGroup: string) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      sourceGroup:
        nextSourceGroup === ALL_SOURCE_GROUPS || prev.sourceGroup === nextSourceGroup
          ? ALL_SOURCE_GROUPS
          : nextSourceGroup,
      source: ALL_SOURCES
    }));
  }

  function handleSearchSubmit() {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      q: searchInput.trim()
    }));
  }

  function handleReset() {
    setSearchInput("");
    setPage(1);
    setFilters({
      q: "",
      audienceGroup: ALL_AUDIENCE_GROUPS,
      sourceGroup: ALL_SOURCE_GROUPS,
      source: ALL_SOURCES
    });
  }

  function handlePageSelect(nextPage: number) {
    const totalPages = Math.max(1, data.totalPages);
    const normalizedPage = Math.min(totalPages, Math.max(1, nextPage));

    if (normalizedPage !== page) {
      setPage(normalizedPage);
    }
  }

  const hasActiveFilters =
    filters.q.length > 0 ||
    filters.audienceGroup !== ALL_AUDIENCE_GROUPS ||
    filters.sourceGroup !== ALL_SOURCE_GROUPS ||
    (shouldUseSourceFilter(filters.audienceGroup) && filters.source !== ALL_SOURCES);
  const showSourceFilter = shouldUseSourceFilter(filters.audienceGroup);
  const showSourceGroupFilter = data.facets.sourceGroups.length > 0;
  const totalPages = Math.max(1, data.totalPages);
  const paginationItems = getPaginationItems(data.page, totalPages);

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 md:px-5">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-950">공지 탐색</h2>
            <p className="mt-1 text-sm text-slate-600">
              대상자와 중분류, 필요한 경우 세부 홈페이지로 범위를 좁혀보세요.
            </p>
          </div>
          <div className="shrink-0 text-sm text-slate-600">
            총{" "}
            <strong className="text-slate-950">
              {data.total.toLocaleString("ko-KR")}
            </strong>
            건
            {hasActiveFilters ? " (필터 적용)" : ""}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-5">
        <div className="min-w-0">
          <AudienceNav
            audienceGroups={data.facets.audienceGroups}
            selectedAudience={filters.audienceGroup}
            onSelect={handleAudienceSelect}
          />
        </div>

        <div className="mt-4 min-w-0">
          <div className="flex min-w-0 flex-col gap-3">
            {showSourceGroupFilter ? (
              <SourceGroupFilter
                sourceGroups={data.facets.sourceGroups}
                selectedSourceGroup={filters.sourceGroup}
                onSelect={handleSourceGroupChange}
              />
            ) : null}

            {showSourceFilter ? (
              <SourceNav
                sources={data.facets.sources}
                selectedSource={filters.source}
                onSelect={handleSourceSelect}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={handleSearchSubmit}
            isLoading={isLoading}
            placeholder="예: 장학금, 수강신청, 졸업요건"
          />
        </div>

        <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            필터 초기화
          </button>
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-xs text-slate-600">
          <span className="max-w-full rounded-full bg-slate-100 px-3 py-1 break-all">
            대상:{" "}
            {filters.audienceGroup === ALL_AUDIENCE_GROUPS
              ? "전체"
              : filters.audienceGroup}
          </span>
          {showSourceGroupFilter ? (
            <span className="max-w-full rounded-full bg-slate-100 px-3 py-1 break-all">
              중분류:{" "}
              {filters.sourceGroup === ALL_SOURCE_GROUPS
                ? "전체"
                : filters.sourceGroup}
            </span>
          ) : null}
          {showSourceFilter ? (
            <span className="max-w-full rounded-full bg-slate-100 px-3 py-1 break-all">
              홈페이지: {filters.source === ALL_SOURCES ? "전체" : filters.source}
            </span>
          ) : null}
          <span className="max-w-full rounded-full bg-slate-100 px-3 py-1 break-all">
            검색어: {filters.q || "없음"}
          </span>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 min-w-0">
          {isLoading ? (
            <NoticeListSkeleton count={data.items.length || PAGE_SIZE} />
          ) : (
            <NoticeList notices={data.items} cleanCategories={data.facets.categories} />
          )}
        </div>

        <div className="mt-5 flex min-w-0 flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => handlePageSelect(page - 1)}
            disabled={data.page <= 1 || isLoading}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            이전
          </button>

          <div className="flex min-w-0 flex-wrap items-center justify-center gap-1.5" aria-label="페이지 선택">
            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => handlePageSelect(item)}
                  disabled={isLoading}
                  aria-current={item === data.page ? "page" : undefined}
                  className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    item === data.page
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => handlePageSelect(page + 1)}
            disabled={data.page >= totalPages || isLoading}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            다음
          </button>
        </div>
      </div>
    </section>
  );
}
