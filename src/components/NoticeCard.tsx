import Link from "next/link";

import { formatSourceLabel, getNoticeSourceNames } from "@/lib/notices";
import { Notice } from "@/lib/types";

function formatDate(value?: string): string {
  if (!value) {
    return "날짜 미상";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(parsed);
}

interface NoticeCardProps {
  notice: Notice;
  showCategory: boolean;
}

export default function NoticeCard({ notice, showCategory }: NoticeCardProps) {
  const summary = notice.summary ?? notice.content.slice(0, 200);
  const sourceNames = getNoticeSourceNames(notice);
  const sourceLabel =
    sourceNames.length > 2
      ? `${sourceNames.slice(0, 2).map(formatSourceLabel).join(", ")} 외 ${sourceNames.length - 2}`
      : sourceNames.map(formatSourceLabel).join(", ");

  return (
    <article className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm">
      <Link href={`/notices/${encodeURIComponent(notice.id)}`} className="block min-w-0">
        <h3 className="line-clamp-2 break-words text-base font-semibold leading-snug text-slate-900 md:text-lg">
          {notice.title}
        </h3>

        <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-xs text-slate-600">
          <span className="max-w-full rounded-full bg-slate-100 px-2 py-1 break-words">{formatDate(notice.date)}</span>
          {notice.audienceGroup ? (
            <span className="max-w-full rounded-full bg-slate-100 px-2 py-1 break-words">{notice.audienceGroup}</span>
          ) : null}
          {notice.sourceGroup ? (
            <span className="max-w-full rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 break-words">{notice.sourceGroup}</span>
          ) : null}
          <span className="max-w-full rounded-full bg-brand-50 px-2 py-1 text-brand-700 break-words">
            {sourceLabel || "홈페이지 미상"}
          </span>
          {showCategory && notice.category ? (
            <span className="max-w-full rounded-full bg-amber-50 px-2 py-1 text-amber-700 break-all">{notice.category}</span>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-3 break-words whitespace-pre-wrap text-sm leading-6 text-slate-700">{summary}</p>
      </Link>
    </article>
  );
}
