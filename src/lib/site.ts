const DEFAULT_SITE_URL = "https://kau-notice-hub.vercel.app";

function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidate = fromEnv || DEFAULT_SITE_URL;

  try {
    return new URL(candidate).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteConfig = {
  name: "KAU Notice Hub",
  title: "KAU Notice Hub | 한국항공대학교 공지 통합 검색",
  description:
    "한국항공대학교 공지를 한 곳에서 확인하고, 대상·홈페이지별 필터와 공지 기반 챗봇으로 필요한 정보를 빠르게 찾습니다.",
  url: resolveSiteUrl(),
  locale: "ko_KR",
  keywords: [
    "한국항공대학교",
    "한국항공대",
    "KAU",
    "공지사항",
    "학사 공지",
    "장학 공지",
    "공지 통합 검색",
    "KAU Notice Hub",
  ],
} as const;

/**
 * 본문(마크다운 포함)을 메타 설명용 평문으로 변환한다.
 * 마크다운 기호와 링크 표기를 제거하고 공백을 정리한 뒤 길이를 제한한다.
 */
export function buildMetaDescription(
  text: string | undefined,
  maxLength = 155,
): string {
  if (!text) {
    return siteConfig.description;
  }

  const plain = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // 이미지
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // 링크 → 텍스트
    .replace(/[#>*_`~|-]/g, " ") // 마크다운 기호
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) {
    return siteConfig.description;
  }

  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength).trimEnd()}…`;
}
