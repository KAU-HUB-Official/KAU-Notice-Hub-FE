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

// 목록 카드 미리보기용 평문 스니펫. content는 Markdown(제목/목록/표/이미지)이라
// 줄바꿈·기호를 그대로 보여주면 지저분하므로, 마크다운 노이즈를 걷어내고 공백을
// 한 칸으로 합쳐 한 줄 요약으로 만든다. 이미지뿐인 공지는 빈 문자열이 된다.
function toPreview(markdown: string, maxLength = 200): string {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // 이미지 마크다운 제거
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 링크 → 보이는 텍스트
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // 헤딩 마커
    .replace(/^\s{0,3}[-*+]\s+/gm, "") // 목록 불릿
    .replace(/[#*`>_~|]/g, " ") // 남은 강조/표 기호
    .replace(/\s+/g, " ") // 줄바꿈 포함 모든 공백을 한 칸으로
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

export default function NoticeCard({ notice, showCategory }: NoticeCardProps) {
  const summary = toPreview(notice.content);
  const sourceNames = getNoticeSourceNames(notice);
  const sourceLabel =
    sourceNames.length > 2
      ? `${sourceNames.slice(0, 2).map(formatSourceLabel).join(", ")} 외 ${sourceNames.length - 2}`
      : sourceNames.map(formatSourceLabel).join(", ");

  return (
    <article className="group w-full min-w-0 rounded-lg border border-slate-200 bg-white p-3.5 transition hover:border-brand-300 hover:shadow-sm md:p-4">
      <Link href={`/notices/${encodeURIComponent(notice.id)}`} className="block min-w-0">
        <h3 className="line-clamp-2 break-words text-base font-semibold leading-snug text-slate-950 group-hover:text-brand-800">
          {notice.title}
        </h3>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span className="break-words">{formatDate(notice.date)}</span>
          {notice.audienceGroup ? (
            <>
              <span aria-hidden className="text-slate-300">·</span>
              <span className="break-words">{notice.audienceGroup}</span>
            </>
          ) : null}
          {notice.sourceGroup ? (
            <>
              <span aria-hidden className="text-slate-300">·</span>
              <span className="break-words text-emerald-700">{notice.sourceGroup}</span>
            </>
          ) : null}
          <span aria-hidden className="text-slate-300">·</span>
          <span className="break-words text-brand-700">{sourceLabel || "홈페이지 미상"}</span>
          {showCategory && notice.category ? (
            <>
              <span aria-hidden className="text-slate-300">·</span>
              <span className="break-all text-amber-700">{notice.category}</span>
            </>
          ) : null}
        </div>

        {summary ? (
          <p className="mt-1.5 line-clamp-2 break-words text-sm leading-6 text-slate-600">{summary}</p>
        ) : null}
      </Link>
    </article>
  );
}
