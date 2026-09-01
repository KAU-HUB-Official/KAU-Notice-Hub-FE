import Link from "next/link";

const DEFAULT_GITHUB_URL = "https://github.com/KAU-HUB-Official";
const DEFAULT_CONTACT_EMAIL = "qktjwl123@gmail.com";

function envValue(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export default function SiteFooter() {
  const githubUrl = envValue(
    process.env.NEXT_PUBLIC_GITHUB_URL,
    DEFAULT_GITHUB_URL,
  );
  const contactEmail = envValue(
    process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    DEFAULT_CONTACT_EMAIL,
  );

  return (
    <footer id="contact" className="mt-6 border-t border-slate-800 bg-slate-950">
      {/* xl 미만에서는 우하단 챗봇 FAB이 떠 있어 링크를 가리지 않도록 아래 여백을 둔다. */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-24 pt-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 xl:pb-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">KAU Notice Hub</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
            분산된 학교 공지를 한 곳에서 확인할 수 있도록 제공하는 통합 탐색
            서비스입니다.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
          <Link
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-slate-700 px-3 py-2 text-slate-200 hover:border-slate-500 hover:bg-slate-900 hover:text-white"
          >
            GitHub
          </Link>
          <Link
            href={`mailto:${contactEmail}`}
            className="rounded-md border border-slate-700 px-3 py-2 text-slate-200 hover:border-slate-500 hover:bg-slate-900 hover:text-white"
          >
            Contact
          </Link>
          <Link
            href="https://www.kau.ac.kr"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-slate-700 px-3 py-2 text-slate-200 hover:border-slate-500 hover:bg-slate-900 hover:text-white"
          >
            KAU
          </Link>
        </div>
      </div>
    </footer>
  );
}
