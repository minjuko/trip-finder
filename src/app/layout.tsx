import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";

import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://trip-finder-mauve.vercel.app",
  ),
  title: {
    default: "TripFinder",
    template: "%s | TripFinder",
  },
  description:
    "지역, 카테고리, 키워드로 국내 관광 콘텐츠를 탐색하고 저장하는 서비스",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "TripFinder",
    url: "/",
    title: "TripFinder | 국내 여행지 탐색",
    description:
      "지역과 취향에 맞는 국내 여행지를 발견하고 저장해보세요.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TripFinder | 국내 여행지 탐색",
    description:
      "지역과 취향에 맞는 국내 여행지를 발견하고 저장해보세요.",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    // 변경: 한국어 서비스의 document language 명시
    <html lang="ko" className={`${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* 변경: 모든 route에서 공유하는 Server Component Header */}
        <Header />

        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
