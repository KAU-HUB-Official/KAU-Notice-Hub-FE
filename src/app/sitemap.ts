import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";
import { noticeService } from "@/server/notices";

export const dynamic = "force-dynamic";

const NOTICE_SITEMAP_PAGE_SIZE = 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      changeFrequency: "hourly",
      priority: 1
    }
  ];

  try {
    const result = await noticeService.listNotices({
      page: 1,
      pageSize: NOTICE_SITEMAP_PAGE_SIZE
    });

    for (const notice of result.items) {
      if (!notice.id) {
        continue;
      }

      entries.push({
        url: `${siteConfig.url}/notices/${encodeURIComponent(notice.id)}`,
        lastModified: notice.date || undefined,
        changeFrequency: "weekly",
        priority: 0.7
      });
    }
  } catch (error) {
    console.error("Failed to build notice sitemap entries:", error);
  }

  return entries;
}
