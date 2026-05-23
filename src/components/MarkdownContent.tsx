import type { ComponentPropsWithoutRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * 백엔드 크롤러가 생성한 Markdown 공지 본문을 안전하게 렌더한다.
 *
 * - `remark-gfm`로 표/체크리스트/취소선 지원
 * - 외부 링크는 새 탭, `rel="noreferrer"`
 * - 이미지는 lazy load + max-width 보정
 * - 기본 HTML은 react-markdown 기본값으로 차단 (raw HTML 무시)
 * - 빈 본문은 안내 문구로 대체
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const trimmed = content?.trim();
  if (!trimmed) {
    return (
      <p className="text-sm leading-7 text-slate-500">본문 정보가 없습니다.</p>
    );
  }

  const proseClass =
    "prose prose-slate prose-sm max-w-none break-words " +
    "prose-headings:font-semibold prose-headings:text-slate-900 " +
    "prose-a:text-brand-700 prose-a:underline prose-a:underline-offset-2 " +
    "prose-img:rounded-md prose-img:border prose-img:border-slate-200 " +
    "prose-table:my-3 prose-th:bg-slate-100 prose-th:px-2 prose-th:py-1 " +
    "prose-td:px-2 prose-td:py-1 prose-td:align-top " +
    "prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 " +
    "prose-pre:bg-slate-900 prose-pre:text-slate-50";

  return (
    <div className={className ? `${proseClass} ${className}` : proseClass}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...rest }: ComponentPropsWithoutRef<"a">) => {
            const isExternal =
              typeof href === "string" && /^https?:\/\//i.test(href);
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer noopener" : undefined}
                {...rest}
              >
                {children}
              </a>
            );
          },
          img: ({ alt, ...rest }: ComponentPropsWithoutRef<"img">) => (
            // 이미지 도메인 화이트리스트 없이 Next/Image 대신 기본 img 사용.
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={alt ?? ""} loading="lazy" {...rest} />
          ),
        }}
      >
        {trimmed}
      </Markdown>
    </div>
  );
}
