import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookmarkButton } from "@/components/bookmark/BookmarkButton";
import { TourDetailGallery } from "@/components/tour/TourDetailGallery";
import { TourDetailInformation } from "@/components/tour/TourDetailInformation";
import { TourDetailOverview } from "@/components/tour/TourDetailOverview";
import { getTourDetail } from "@/lib/tour-api/tour-detail";

interface PlaceDetailPageProps {
  params: Promise<{
    contentId: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: PlaceDetailPageProps): Promise<Metadata> => {
  const { contentId } = await params;

  // 상세 데이터 기반 동적 metadata 생성
  const detail =
    await getTourDetail(contentId);

  if (!detail) {
    return {
      title: "관광 콘텐츠를 찾을 수 없습니다",
    };
  }

  return {
    title: detail.title,
    description:
      detail.overview ??
      detail.address?.primary ??
      `${detail.title} 관광 정보`,
  };
};

const PlaceDetailPage = async ({
  params,
}: PlaceDetailPageProps) => {
  const { contentId } = await params;

  // 상세 데이터 orchestration을 Server Component에서 호출
  const detail =
    await getTourDetail(contentId);

  if (!detail) {
    notFound();
  }

  const address = detail.address
    ? [
        detail.address.primary,
        detail.address.detail,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-6"
      >
        <ol className="flex items-center gap-2 text-sm text-slate-500">
          <li>
            <Link
              href="/explore"
              className="transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            >
              여행지 탐색
            </Link>
          </li>

          <li aria-hidden="true">/</li>

          <li
            aria-current="page"
            className="truncate text-slate-700"
          >
            {detail.title}
          </li>
        </ol>
      </nav>

      <header className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-sm font-semibold text-slate-500">
              PLACE
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {detail.title}
            </h1>

            {address ? (
              <p className="mt-3 text-base leading-7 text-slate-600">
                {address}
              </p>
            ) : null}
          </div>

          {/* 변경: Server Component 내부에서
              bookmark interaction만 Client Component로 격리 */}
          <div className="flex flex-wrap gap-3">
            <BookmarkButton
              content={detail}
            />

            {detail.homepage ? (
              <a
                href={detail.homepage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                홈페이지 방문
                <span
                  aria-hidden="true"
                  className="ml-1.5"
                >
                  ↗
                </span>
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <TourDetailGallery
        title={detail.title}
        thumbnail={detail.thumbnail}
        images={detail.images}
      />

      <div className="mx-auto mt-12 max-w-5xl space-y-10">
        <TourDetailOverview
          overview={detail.overview}
        />

        <TourDetailInformation
          information={
            detail.information
          }
        />
      </div>
    </main>
  );
};

export default PlaceDetailPage;