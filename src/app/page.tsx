import ChatPanel from "@/components/chat-panel";
import NoticeExplorer, {
  NoticeExplorerFilters,
} from "@/components/notice-explorer";
import {
  ALL_AUDIENCE_GROUPS,
  ALL_SOURCE_GROUPS,
  ALL_SOURCES,
  normalizeFilterValue,
  shouldUseSourceFilter,
} from "@/lib/notices";
import { noticeService } from "@/server/notices";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parsePage(value: string | undefined): number {
  if (!value) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawAudience = firstQueryValue(searchParams?.audience);
  const rawSourceGroup = firstQueryValue(searchParams?.group);
  const rawSource = firstQueryValue(searchParams?.source);
  const rawQuery = firstQueryValue(searchParams?.q)?.trim() ?? "";
  const page = parsePage(firstQueryValue(searchParams?.page));

  const initialNormalizedAudience = normalizeFilterValue(rawAudience);
  const initialNormalizedSourceGroup = normalizeFilterValue(rawSourceGroup);
  const initialNormalizedSource = normalizeFilterValue(rawSource);

  let audienceGroup = initialNormalizedAudience;
  let sourceGroup = initialNormalizedSourceGroup;
  let source = shouldUseSourceFilter(audienceGroup) ? initialNormalizedSource : undefined;

  let initialData = await noticeService.listNotices({
    q: rawQuery || undefined,
    audienceGroup,
    sourceGroup,
    source,
    page,
    pageSize: 15,
  });

  if (audienceGroup && !initialData.facets.audienceGroups.includes(audienceGroup)) {
    audienceGroup = undefined;
  }

  if (sourceGroup && !initialData.facets.sourceGroups.includes(sourceGroup)) {
    sourceGroup = undefined;
  }

  if (!shouldUseSourceFilter(audienceGroup)) {
    source = undefined;
  } else if (source && !initialData.facets.sources.includes(source)) {
    source = undefined;
  }

  if (
    audienceGroup !== initialNormalizedAudience ||
    sourceGroup !== initialNormalizedSourceGroup ||
    source !== initialNormalizedSource
  ) {
    initialData = await noticeService.listNotices({
      q: rawQuery || undefined,
      audienceGroup,
      sourceGroup,
      source,
      page: 1,
      pageSize: 15,
    });
  }

  const initialFilters: NoticeExplorerFilters = {
    q: rawQuery,
    audienceGroup: audienceGroup ?? ALL_AUDIENCE_GROUPS,
    sourceGroup: sourceGroup ?? ALL_SOURCE_GROUPS,
    source: source ?? ALL_SOURCES,
  };

  return (
    <main className="min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <header className="mb-6">
          <p className="text-sm font-medium text-brand-700">MVP</p>
          <h1 className="mt-1 break-words text-3xl font-bold tracking-tight text-slate-900">
            KAU Notice Hub
          </h1>
          <p className="mt-2 text-slate-600">
            대상자별 분류 + 중분류 탐색 + AI 질의응답
          </p>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <NoticeExplorer
              initialData={initialData}
              initialFilters={initialFilters}
            />
          </div>
          <div className="min-w-0">
            <ChatPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
