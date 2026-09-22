import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookmarkButton } from "@/components/bookmark/BookmarkButton";
import { PlaceShareButton } from "@/components/tour/PlaceShareButton";
import { CopyAddressButton } from "@/components/tour/CopyAddressButton";
import { TourDetailGallery } from "@/components/tour/TourDetailGallery";
import { TourDetailInformation } from "@/components/tour/TourDetailInformation";
import { TourDetailOverview } from "@/components/tour/TourDetailOverview";
import { TourDetailRepeatingInformation } from "@/components/tour/TourDetailRepeatingInformation";
import { getTourDetail } from "@/lib/tour-api/tour-detail";
import { Icon } from "@/components/ui/Icon";
import { CATEGORY_LABELS, REGION_LABELS } from "@/constants/tour-labels";

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
    openGraph: {
      type: "website",
      title: `${detail.title} | TripFinder`,
      description:
        detail.overview ??
        detail.address?.primary ??
        `${detail.title} 관광 정보`,
      images: detail.thumbnail?.url
        ? [{ url: detail.thumbnail.url, alt: detail.title }]
        : undefined,
    },
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: detail.title,
    description: detail.overview ?? undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://trip-finder-mauve.vercel.app"}/places/${detail.id}`,
    image: detail.thumbnail?.url ?? undefined,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: address,
        }
      : undefined,
    geo: detail.coordinates
      ? {
          "@type": "GeoCoordinates",
          latitude: detail.coordinates.latitude,
          longitude: detail.coordinates.longitude,
        }
      : undefined,
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {detail.title}
            </h1>

            {address ? (
              <p className="mt-3 text-base leading-7 text-slate-600">
                {address}
                <CopyAddressButton address={address} />
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {detail.region?.regionCode && REGION_LABELS[detail.region.regionCode] ? (
                <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong">
                  {REGION_LABELS[detail.region.regionCode]}
                </span>
              ) : null}
              {detail.classification?.depth1 && CATEGORY_LABELS[detail.classification.depth1] ? (
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {CATEGORY_LABELS[detail.classification.depth1]}
                </span>
              ) : null}
              {detail.phone ? (
                <a
                  href={`tel:${detail.phone.replace(/[^0-9+]/g, "")}`}
                  className="inline-flex items-center rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  전화 {detail.phone}
                </a>
              ) : null}
            </div>
          </div>

          {/* 변경: Server Component 내부에서
              bookmark interaction만 Client Component로 격리 */}
          <div className="flex flex-wrap gap-3">
            <BookmarkButton
              content={detail}
            />

            <PlaceShareButton title={detail.title} />

            {detail.coordinates ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${detail.coordinates.latitude},${detail.coordinates.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit shrink-0 items-center justify-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand/30 hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                지도 보기
                <Icon name="map-pin" size={16} className="ml-2" />
              </a>
            ) : null}

            {detail.homepage ? (
              <a
                href={detail.homepage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                홈페이지 방문
                <Icon name="external-link" size={16} className="ml-2" />
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

        <TourDetailRepeatingInformation
          items={detail.repeatingInformation}
        />
      </div>
    </main>
  );
};

export default PlaceDetailPage;
