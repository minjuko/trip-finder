import type { Metadata } from "next";

import { TravelListsHome } from "@/components/travel-lists/TravelListsHome";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "내 여행 목록",
  description: "계정 여행 목록을 관리합니다.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export default function TravelListsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <TravelListsHome />
    </main>
  );
}
