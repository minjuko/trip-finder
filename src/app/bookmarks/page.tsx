import type { Metadata } from "next";

import { BookmarkList } from "@/components/bookmark/BookmarkList";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "관심 여행지",
  description: "TripFinder에서 관심 여행지로 저장한 장소를 다시 확인합니다.",
};

const BookmarksPage = () => {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      <header className="mb-8">
        <p className="tripfinder-wordmark mb-3 inline-flex items-center gap-2 text-brand">
          <Icon name="bookmark" size={18} />
          MY TRIPS
        </p>

        <h1 className="text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl">
          관심 여행지
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          관심 있는 여행지를 모아보고 상세 정보를 다시 확인해 보세요.
        </p>
      </header>

      {/* 변경: localStorage 의존 영역만 Client Component로 분리 */}
      <BookmarkList />
    </main>
  );
};

export default BookmarksPage;
