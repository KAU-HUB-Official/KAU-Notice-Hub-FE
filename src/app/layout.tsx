import type { Metadata } from "next";

import SiteFooter from "@/components/SiteFooter";

import "./globals.css";

export const metadata: Metadata = {
  title: "KAU Notice Hub",
  description: "한국항공대학교 공지를 한 곳에서 확인하고 필요한 정보를 빠르게 찾습니다."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
