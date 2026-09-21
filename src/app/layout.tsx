import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";
import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TripFinder",
    template: "%s | TripFinder",
  },
  description:
    "지역, 카테고리, 키워드로 국내 관광 콘텐츠를 탐색하고 저장하는 서비스",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    // 변경: 한국어 서비스의 document language 명시
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
