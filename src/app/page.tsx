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
    description: "산과 바다, 숲에서 쉬어가기",
    icon: "mountain",
  },
  {
    code: "HS",
    name: "역사관광",
    description: "시간이 쌓인 유적과 이야기",
    icon: "landmark",
  },
  {
    code: "VE",
    name: "문화관광",
    description: "전시와 공연, 지역의 문화",
    icon: "sparkles",
  },
  {
    code: "EX",
    name: "체험관광",
    description: "직접 해보며 남기는 여행",
    icon: "compass",
  },
  {
    code: "LS",
    name: "레저스포츠",
    description: "몸을 움직여 즐기는 하루",
    icon: "waves",
  },
  {
    code: "FD",
    name: "음식",
    description: "여행지에서 만나는 특별한 맛",
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
      <section className="home-hero-surface relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-10 size-80 rounded-full border-[36px] border-white/50 blur-[1px] sm:size-[30rem]"
        />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 text-brand">
              <span className="size-1.5 rounded-full bg-brand" />
              <span className="tripfinder-wordmark">TRIPFINDER</span>
            </p>

            <h1 className="max-w-2xl text-pretty text-4xl font-bold leading-[1.12] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
              <span className="lg:block">다음 여행지를</span>{" "}
              <span className="text-brand">발견해 보세요</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
              지역과 관심사에 맞는 국내 관광지를 찾아보세요.
            </p>

            <HomeSearch />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/explore"
                className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-brand bg-brand px-6 py-3 text-base font-semibold text-white shadow-sm shadow-sky-900/15 transition-colors hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
              >
                여행지 탐색 시작하기
                <Icon
                  name="arrow-right"
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/bookmarks"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                <Icon name="bookmark" size={18} /> 관심 여행지 보기
              </Link>
            </div>
          </div>

          <div
            aria-label="빠른 여행지 탐색"
            className="relative mx-auto hidden w-full max-w-md lg:block"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 p-6 text-white shadow-2xl shadow-sky-900/15">
              <div className="seasonal-grid-pattern absolute inset-0 opacity-40" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur">
                    빠른 탐색
                  </span>
                  <Icon
                    name="compass"
                    size={19}
                    className="grid size-10 place-items-center rounded-full border border-white/20 p-2"
                  />
                </div>
                <div>
                  <p className="text-base text-sky-100">계절 여행 추천</p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
                    이번 계절의
                    <br />
                    여행지를 찾아보세요
                  </h2>
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-sm font-medium text-white/90 backdrop-blur">
                    <Icon name="bookmark" size={14} /> 마음에 드는 여행지를
                    저장해 보세요
                  </p>
                  <nav
                    aria-label="계절 추천 여행지"
                    className="mt-7 grid gap-2"
                  >
                    {SEASONAL_RECOMMENDATIONS.map((recommendation) => (
                      <Link
                        key={recommendation.title}
                        href={`/explore?keyword=${encodeURIComponent(recommendation.keyword)}`}
                        className="group flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-700"
                      >
                        <span>
                          <span className="mr-2 text-xs font-medium text-sky-100">
                            {recommendation.region}
                          </span>
                          {recommendation.title}
                        </span>
                        <Icon
                          name="arrow-right"
                          size={16}
                          className="transition group-hover:translate-x-1"
                        />
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
        className="mx-auto w-full max-w-7xl px-5 py-20 lg:px-8 lg:py-24"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="region-heading"
              className="text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl"
            >
              지역으로 탐색
            </h2>

            <p className="mt-3 text-base leading-7 text-ink-muted sm:text-lg">
              가고 싶은 지역을 먼저 고르면 여행지를 빠르게 좁힐 수 있어요.
            </p>
          </div>

          <Link
            href="/explore"
            className="group inline-flex w-fit items-center gap-1 rounded-full border border-line bg-white px-4 py-2.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
          >
            전체 지역 보기{" "}
            <Icon
              name="arrow-right"
              size={16}
              className="ml-1 inline transition group-hover:translate-x-1"
            />
          </Link>
        </div>

        <ul className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {REGION_LINKS.map((region) => (
            <li key={region.code}>
              <Link
                href={`/explore?region=${region.code}`}
                className="group relative flex min-h-24 items-center justify-between overflow-hidden rounded-2xl border border-card-border bg-gradient-to-br from-white to-blue-50/80 px-4 py-4 text-left shadow-[var(--shadow-region-card)] transition hover:-translate-y-1 hover:border-brand hover:shadow-[var(--shadow-region-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-5 -top-6 size-16 rounded-full bg-sky-100/70 transition group-hover:scale-125"
                />
                <span className="relative text-base font-bold text-slate-900">
                  {region.name}
                </span>
                <Icon
                  name="arrow-right"
                  size={18}
                  className="relative text-slate-500 transition group-hover:translate-x-1 group-hover:text-brand"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 변경: 실제 관광 분류 대분류 코드 기반 탐색 진입점 */}
      <section
        aria-labelledby="category-heading"
        className="home-category-surface border-y border-sky-100"
      >
        <div className="mx-auto w-full max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="category-heading"
                className="text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl"
              >
                카테고리로 탐색
              </h2>

              <p className="mt-3 text-base leading-7 text-ink-muted sm:text-lg">
                오늘의 기분과 여행 목적에 맞는 테마를 골라보세요.
              </p>
            </div>
            <Link
              href="/explore"
              className="group inline-flex w-fit items-center gap-1 rounded-full border border-sky-200 bg-white/80 px-4 py-2.5 text-base font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-brand/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
            >
              모든 테마 보기{" "}
              <Icon
                name="arrow-right"
                size={17}
                className="transition group-hover:translate-x-1"
              />
            </Link>
          </div>

          <ul className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_LINKS.map((category) => (
              <li key={category.code}>
                <Link
                  href={`/explore?category1=${category.code}`}
                  className="group relative flex min-h-36 items-center justify-between overflow-hidden rounded-3xl border border-card-border bg-white/90 p-6 shadow-[var(--shadow-category-card)] backdrop-blur transition hover:border-brand hover:bg-white hover:shadow-[var(--shadow-category-card-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                >
                  <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-sky-400 to-cyan-300 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-50 text-brand shadow-inner shadow-white transition-transform group-hover:scale-105"
                    >
                      <Icon name={category.icon as IconName} size={25} />
                    </span>
                    <span>
                      <strong className="block text-lg font-semibold text-slate-950">
                        {category.name}
                      </strong>
                      <span className="mt-1.5 block text-sm leading-6 text-slate-600">
                        {category.description}
                      </span>
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="ml-3 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand"
                  >
                    <Icon name="arrow-right" size={17} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
