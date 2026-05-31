import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/MarkdownContent";
import { formatSourceLabel, getNoticeSourceNames } from "@/lib/notices";
import { NoticeNavigation } from "@/lib/types";
import { noticeService } from "@/server/notices";

export const dynamic = "force-dynamic";

interface NoticeDetailPageProps {
  params: {
    id: string;
  };
}

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const noticeId = decodeURIComponent(params.id);
  const notice = await noticeService.getNoticeById(noticeId);

  if (!notice) {
    notFound();
  }

  let navigation: NoticeNavigation = {
    previous: null,
    next: null
  };

  try {
    navigation = await noticeService.getNoticeNavigation(noticeId);
  } catch (error) {
    console.error("Failed to load notice navigation:", error);
  }

  const sourceNames = getNoticeSourceNames(notice);

  return (
    <main className="w-full bg-slate-50 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto w-full min-w-0 max-w-4xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <Link href="/" className="inline-flex rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950">
          ← 목록으로 돌아가기
        </Link>

        <h1 className="mt-5 break-words text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{notice.title}</h1>

        <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-sm text-slate-600">
          {notice.date ? <span className="max-w-full rounded-md bg-slate-100 px-3 py-1 break-words">{notice.date}</span> : null}
          {notice.audienceGroup ? (
            <span className="max-w-full rounded-md bg-slate-100 px-3 py-1 break-words">{notice.audienceGroup}</span>
          ) : null}
          {notice.sourceGroup ? (
            <span className="max-w-full rounded-md bg-emerald-50 px-3 py-1 text-emerald-700 break-words">{notice.sourceGroup}</span>
          ) : null}
          {notice.category ? (
            <span className="max-w-full rounded-md bg-amber-50 px-3 py-1 text-amber-700 break-words">{notice.category}</span>
          ) : null}
        </div>

        {sourceNames.length > 0 ? (
          <div className="mt-3 min-w-0 text-sm text-slate-600">
            <span className="font-medium text-slate-800">홈페이지</span>
            <div className="mt-2 flex min-w-0 flex-wrap gap-2">
              {sourceNames.map((source) => (
                <span key={source} className="max-w-full rounded-md bg-brand-50 px-3 py-1 text-brand-700 break-words">
                  {formatSourceLabel(source)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {notice.url ? (
          <p className="mt-3 min-w-0 text-sm">
            원문 링크: <Link href={notice.url} target="_blank" rel="noreferrer" className="break-all hover:underline">{notice.url}</Link>
          </p>
        ) : null}

        <section className="mt-6 rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">본문</h2>
          <div className="mt-2">
            <MarkdownContent content={notice.content} />
          </div>
        </section>

        {notice.attachments.length > 0 ? (
          <section className="mt-4 rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">첨부파일</h2>
            <ul className="mt-2 min-w-0 space-y-1 text-sm text-slate-700">
              {notice.attachments.map((attachment, index) => (
                <li key={`${attachment.url}-${index}`}>
                  <Link href={attachment.url} target="_blank" rel="noreferrer" className="break-all hover:underline">
                    {attachment.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <nav
          aria-label="공지 이동"
          className="mt-6 grid min-w-0 gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2"
        >
          {navigation.previous ? (
            <Link
              href={`/notices/${encodeURIComponent(navigation.previous.id)}`}
              className="min-w-0 rounded-lg border border-slate-200 p-4 text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-slate-900"
            >
              <span className="block text-xs font-semibold text-slate-500">← 이전 공지</span>
              <span className="mt-1 line-clamp-2 text-sm font-medium">
                {navigation.previous.title}
              </span>
              {navigation.previous.date ? (
                <span className="mt-1 block text-xs text-slate-500">
                  {navigation.previous.date}
                </span>
              ) : null}
            </Link>
          ) : (
            <div className="min-w-0 rounded-lg border border-slate-200 p-4 text-slate-400">
              <span className="block text-xs font-semibold">이전 공지</span>
              <span className="mt-1 block text-sm">이전 공지가 없습니다.</span>
            </div>
          )}

          {navigation.next ? (
            <Link
              href={`/notices/${encodeURIComponent(navigation.next.id)}`}
              className="min-w-0 rounded-lg border border-slate-200 p-4 text-right text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-slate-900"
            >
              <span className="block text-xs font-semibold text-slate-500">다음 공지 →</span>
              <span className="mt-1 line-clamp-2 text-sm font-medium">
                {navigation.next.title}
              </span>
              {navigation.next.date ? (
                <span className="mt-1 block text-xs text-slate-500">
                  {navigation.next.date}
                </span>
              ) : null}
            </Link>
          ) : (
            <div className="min-w-0 rounded-lg border border-slate-200 p-4 text-right text-slate-400">
              <span className="block text-xs font-semibold">다음 공지</span>
              <span className="mt-1 block text-sm">다음 공지가 없습니다.</span>
            </div>
          )}
        </nav>
      </div>
    </main>
  );
}
