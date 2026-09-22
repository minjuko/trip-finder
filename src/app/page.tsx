import Link from "next/link";

import { HomeSearch } from "@/components/search/HomeSearch";

const REGION_LINKS = [
  {
    code: "11",
    name: "서울특별시",
    note: "도시의 결을 따라",
  },
  {
    code: "26",
    name: "부산광역시",
    note: "바다와 골목 사이",
  },
  {
    code: "28",
    name: "인천광역시",
    note: "새로운 장면을 찾아",
  },
  {
    code: "41",
    name: "경기도",
    note: "도심 가까운 여유",
  },
  {
    code: "50",
    name: "제주특별자치도",
    note: "느리게 걷는 섬",
  },
  {
    code: "51",
    name: "강원특별자치도",
    note: "숲과 바람을 만나는",
  },
] as const;

const CATEGORY_LINKS = [
  {
    code: "NA",
    name: "자연관광",
    icon: "↗",
  },
  {
    code: "HS",
    name: "역사관광",
    icon: "◈",
  },
  {
    code: "VE",
    name: "문화관광",
    icon: "✦",
  },
  {
    code: "EX",
    name: "체험관광",
    icon: "◎",
  },
  {
    code: "LS",
    name: "레저스포츠",
    icon: "△",
  },
  {
    code: "FD",
    name: "음식",
    icon: "⌁",
  },
] as const;

export default function Home() {
  return (
    <main>
      {/* 변경: 서비스의 목적과 검색 진입점을 제공하는 Hero */}
      <section className="relative overflow-hidden border-b border-line bg-[radial-gradient(circle_at_15%_20%,#dcefe8_0,transparent_32%),linear-gradient(135deg,#f4fbf7_0%,#fbfaf7_55%,#f2eee6_100%)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-10 size-80 rounded-full border-[36px] border-white/50 blur-[1px] sm:size-[30rem]" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/70 px-3 py-1.5 text-xs font-bold tracking-[0.16em] text-brand">
              <span className="size-1.5 rounded-full bg-brand" /> EXPLORE KOREA
            </p>

            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-[4.5rem]">
              국내 여행지를
              <br />한곳에서 <span className="text-brand">발견</span>해보세요.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
              오늘의 기분과 가고 싶은 지역을 따라,
              아직 만나지 못한 여행의 장면을 찾아보세요.
            </p>

            <HomeSearch />

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link
              href="/explore"
              className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
            >
              전체 여행지 탐색하기
            </Link>
              <span className="text-slate-400">필터 · 저장 · 다시 찾기</span>
            </div>
          </div>

          <div aria-label="여행 영감을 보여주는 장식 영역" className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#183b38] p-6 text-white shadow-2xl shadow-brand/20">
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:34px_34px]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">YOUR NEXT PLACE</span>
                  <span className="grid size-10 place-items-center rounded-full border border-white/20 text-lg">↗</span>
                </div>
                <div>
                  <p className="text-sm text-emerald-100/75">지금 떠오르는 곳</p>
                  <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">바다를<br />따라 걷는 하루</p>
                  <div className="mt-6 flex items-center gap-2 text-sm text-emerald-100/80"><span className="size-2 rounded-full bg-amber-300" /> 전국의 관광 콘텐츠를 탐색해보세요</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-8 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-xl">
              <p className="text-[10px] font-bold tracking-widest text-slate-600">TRIP NOTE</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">저장해두면 다시 만날 수 있어요</p>
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
            <p className="mb-2 text-xs font-bold tracking-[0.16em] text-brand">
              REGION
            </p>

            <h2
              id="region-heading"
              className="text-3xl font-bold tracking-[-0.04em] text-slate-950"
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

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {REGION_LINKS.map(
            (region) => (
              <li key={region.code}>
                <Link
                  href={`/explore?region=${region.code}`}
                    className="group flex min-h-28 flex-col justify-between rounded-2xl border border-line bg-white p-4 text-left transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg hover:shadow-slate-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <span className="text-xs font-medium text-slate-600">0{REGION_LINKS.indexOf(region) + 1}</span>
                    <span><span className="block text-sm font-bold text-slate-900">{region.name}</span><span className="mt-1 block text-xs text-slate-500 transition group-hover:text-brand">{region.note}</span></span>
                </Link>
              </li>
            ),
          )}
        </ul>
      </section>

      {/* 변경: 실제 관광 분류 대분류 코드 기반 탐색 진입점 */}
      <section
        aria-labelledby="category-heading"
        className="border-y border-line bg-[#f1f3ef]"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.16em] text-brand">
              CATEGORY
            </p>

            <h2
              id="category-heading"
            className="text-3xl font-bold tracking-[-0.04em] text-slate-950"
            >
              카테고리로 탐색
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              관심 있는 여행 유형에서
              탐색을 시작하세요.
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-brand-soft text-lg text-brand">{category.icon}</span>
                      {category.name}
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand"
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
