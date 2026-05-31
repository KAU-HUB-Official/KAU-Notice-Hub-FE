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
import { siteConfig } from "@/lib/site";
import { noticeService } from "@/server/notices";

export const dynamic = "force-dynamic";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  alternateName: "한국항공대학교 공지 통합 검색",
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: "ko",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteConfig.url}/?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

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
    <main className="w-full px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <header className="mb-6 min-w-0 border-b border-slate-200 pb-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-700">
              KAU Notice Hub
            </p>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              한국항공대학교 공지 통합 검색
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              필요한 공지를 빠르게 찾고, 궁금한 내용은 공지 기반 챗봇으로
              확인하세요.
            </p>
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div id="notices" className="min-w-0 scroll-mt-8">
            <NoticeExplorer
              initialData={initialData}
              initialFilters={initialFilters}
            />
          </div>
          <div id="chat" className="min-w-0 scroll-mt-8 xl:sticky xl:top-8">
            <ChatPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
