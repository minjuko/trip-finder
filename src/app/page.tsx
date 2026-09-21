import Link from "next/link";

import { HomeSearch } from "@/components/search/HomeSearch";

const REGION_LINKS = [
  {
    code: "11",
    name: "서울특별시",
  },
  {
    code: "26",
    name: "부산광역시",
  },
  {
    code: "28",
    name: "인천광역시",
  },
  {
    code: "41",
    name: "경기도",
  },
  {
    code: "50",
    name: "제주특별자치도",
  },
  {
    code: "51",
    name: "강원특별자치도",
  },
] as const;

const CATEGORY_LINKS = [
  {
    code: "NA",
    name: "자연관광",
  },
  {
    code: "HS",
    name: "역사관광",
  },
  {
    code: "VE",
    name: "문화관광",
  },
  {
    code: "EX",
    name: "체험관광",
  },
  {
    code: "LS",
    name: "레저스포츠",
  },
  {
    code: "FD",
    name: "음식",
  },
] as const;

export default function Home() {
  return (
    <main>
      {/* 변경: 서비스의 목적과 검색 진입점을 제공하는 Hero */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 text-center sm:py-24 lg:px-8 lg:py-28">
          <p className="mb-4 text-sm font-semibold tracking-wide text-slate-500">
            EXPLORE KOREA
          </p>

          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            국내 여행지를
            <br className="hidden sm:block" />{" "}
            한곳에서 탐색해보세요.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            지역과 카테고리,
            키워드로 국내 관광
            콘텐츠를 찾고 관심 있는
            장소를 저장할 수 있습니다.
          </p>

          <HomeSearch />

          <div className="mt-5">
            <Link
              href="/explore"
              className="text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-4"
            >
              전체 여행지 탐색하기
            </Link>
          </div>
        </div>
      </section>

      {/* 변경: 실제 법정동 코드 기반 지역 탐색 진입점 */}
      <section
        aria-labelledby="region-heading"
        className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500">
              REGION
            </p>

            <h2
              id="region-heading"
              className="text-2xl font-bold tracking-tight text-slate-950"
            >
              지역으로 탐색
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              원하는 지역을 선택해
              관광 콘텐츠를 확인하세요.
            </p>
          </div>

          <Link
            href="/explore"
            className="w-fit text-sm font-semibold text-slate-600 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-4"
          >
            전체 지역 보기 →
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {REGION_LINKS.map(
            (region) => (
              <li key={region.code}>
                <Link
                  href={`/explore?region=${region.code}`}
                  className="flex min-h-24 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-center text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                >
                  {region.name}
                </Link>
              </li>
            ),
          )}
        </ul>
      </section>

      {/* 변경: 실제 관광 분류 대분류 코드 기반 탐색 진입점 */}
      <section
        aria-labelledby="category-heading"
        className="bg-slate-50"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500">
              CATEGORY
            </p>

            <h2
              id="category-heading"
              className="text-2xl font-bold tracking-tight text-slate-950"
            >
              카테고리로 탐색
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              관심 있는 여행 유형에서
              탐색을 시작하세요.
            </p>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_LINKS.map(
              (category) => (
                <li
                  key={category.code}
                >
                  <Link
                    href={`/explore?category1=${category.code}`}
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                  >
                    <span className="font-semibold text-slate-900">
                      {category.name}
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700"
                    >
                      →
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