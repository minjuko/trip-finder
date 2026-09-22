import Link from "next/link";
import type { Metadata } from "next";

import { HomeSearch } from "@/components/search/HomeSearch";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "국내 여행지 탐색",
  description:
    "지역과 취향에 맞는 국내 여행지를 탐색하고 관심 장소를 저장해 보세요.",
};

const REGION_LINKS = [
  {
    code: "11",
    name: "서울특별시",
  },
  {
    code: "26",
    name: "부산광역시",
  },
  { code: "27", name: "대구광역시" },
  {
    code: "28",
    name: "인천광역시",
  },
  { code: "29", name: "광주광역시" },
  { code: "30", name: "대전광역시" },
  { code: "31", name: "울산광역시" },
  { code: "36", name: "세종특별자치시" },
  {
    code: "41",
    name: "경기도",
  },
  { code: "42", name: "강원특별자치도" },
  { code: "43", name: "충청북도" },
  { code: "44", name: "충청남도" },
  { code: "45", name: "전북특별자치도" },
  { code: "46", name: "전라남도" },
  { code: "47", name: "경상북도" },
  { code: "48", name: "경상남도" },
  {
    code: "50",
    name: "제주특별자치도",
  },
] as const;

const CATEGORY_LINKS = [
  {
    code: "NA",
    name: "자연관광",
    icon: "mountain",
  },
  {
    code: "HS",
    name: "역사관광",
    icon: "landmark",
  },
  {
    code: "VE",
    name: "문화관광",
    icon: "sparkles",
  },
  {
    code: "EX",
    name: "체험관광",
    icon: "compass",
  },
  {
    code: "LS",
    name: "레저스포츠",
    icon: "waves",
  },
  {
    code: "FD",
    name: "음식",
    icon: "utensils",
  },
] as const;

const SEASONAL_RECOMMENDATIONS = [
  { region: "강원 속초", title: "설악산", keyword: "설악산" },
  { region: "경북 경주", title: "첨성대 · 황리단길", keyword: "경주" },
  { region: "전북 정읍", title: "내장산", keyword: "내장산" },
  { region: "전남 순천", title: "순천만습지", keyword: "순천만습지" },
] as const;

export default function Home() {
  return (
    <main>
      {/* 변경: 서비스의 목적과 검색 진입점을 제공하는 Hero */}
      <section className="relative overflow-hidden border-b border-line bg-[radial-gradient(circle_at_15%_20%,#e0f2fe_0,transparent_34%),linear-gradient(135deg,#f0f9ff_0%,#fbfdff_56%,#f0fdfa_100%)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-10 size-80 rounded-full border-[36px] border-white/50 blur-[1px] sm:size-[30rem]" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 text-brand">
              <span className="size-1.5 rounded-full bg-brand" />
              <span className="tripfinder-wordmark">TRIPFINDER</span>
            </p>

            <h1 className="max-w-2xl text-4xl font-bold leading-[1.12] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
              다음 여행지를 <span className="text-brand">발견해 보세요.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
              지역과 관심사에 맞는 국내 관광지를 찾아보세요.
            </p>

            <HomeSearch />

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link
              href="/explore"
              className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
            >
              전체 여행지 보기
            </Link>
            </div>
          </div>

          <div aria-label="빠른 여행지 탐색" className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 p-6 text-white shadow-2xl shadow-sky-900/15">
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:34px_34px]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">빠른 탐색</span>
                  <Icon name="compass" size={19} className="grid size-10 place-items-center rounded-full border border-white/20 p-2" />
                </div>
                <div>
                  <p className="text-sm text-sky-100">계절 여행 추천</p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em]">이번 계절의<br />여행지를 찾아보세요</h2>
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
                    <Icon name="bookmark" size={14} /> 마음에 드는 여행지를 저장해 보세요
                  </p>
                  <nav aria-label="계절 추천 여행지" className="mt-7 grid gap-2">
                    {SEASONAL_RECOMMENDATIONS.map((recommendation) => (
                      <Link
                        key={recommendation.title}
                        href={`/explore?keyword=${encodeURIComponent(recommendation.keyword)}`}
                        className="group flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-700"
                      >
                        <span><span className="mr-2 text-xs font-medium text-sky-100">{recommendation.region}</span>{recommendation.title}</span>
                        <Icon name="arrow-right" size={16} className="transition group-hover:translate-x-1" />
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 변경: 실제 법정동 코드 기반 지역 탐색 진입점 */}
      <section
        aria-labelledby="region-heading"
        className="mx-auto w-full max-w-7xl px-5 py-20 lg:px-8"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="region-heading"
              className="text-3xl font-bold tracking-[-0.04em] text-slate-950"
            >
              지역으로 탐색
            </h2>

          </div>

          <Link
            href="/explore"
            className="group inline-flex w-fit items-center text-sm font-semibold text-slate-600 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-4"
          >
            전체 지역 보기 <Icon name="arrow-right" size={16} className="ml-1 inline transition group-hover:translate-x-1" />
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {REGION_LINKS.map(
            (region) => (
              <li key={region.code}>
                <Link
                  href={`/explore?region=${region.code}`}
                    className="group flex min-h-20 items-center justify-between rounded-2xl border border-line bg-white px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-slate-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <span className="text-sm font-bold text-slate-900">{region.name}</span>
                    <Icon name="arrow-right" size={16} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-brand" />
                </Link>
              </li>
            ),
          )}
        </ul>
      </section>

      {/* 변경: 실제 관광 분류 대분류 코드 기반 탐색 진입점 */}
      <section
        aria-labelledby="category-heading"
        className="border-y border-line bg-[#eef6ff]"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
          <div>
            <h2
              id="category-heading"
            className="text-3xl font-bold tracking-[-0.04em] text-slate-950"
            >
              카테고리로 탐색
            </h2>

          </div>

          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_LINKS.map(
              (category) => (
                <li
                  key={category.code}
                >
                  <Link
                    href={`/explore?category1=${category.code}`}
                    className="group flex items-center justify-between rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg hover:shadow-slate-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <span className="flex items-center gap-3 font-semibold text-slate-900">
                      <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-brand-soft text-lg text-brand"><Icon name={category.icon as IconName} size={19} /></span>
                      {category.name}
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-brand"
                    >
                      <Icon name="arrow-right" size={17} />
                    </span>
                  </Link>
                </li>
              ),
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}
