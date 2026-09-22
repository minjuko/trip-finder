"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/Icon";

const NAV_ITEMS = [
  { href: "/explore", label: "여행지 탐색", shortLabel: "탐색" },
  { href: "/bookmarks", label: "저장한 여행지", shortLabel: "저장" },
] as const;

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-[4.5rem] sm:px-5 lg:px-8">
        <Link
          href="/"
          aria-label="TripFinder 홈"
          className="group inline-flex min-w-0 items-center gap-2 text-base font-bold tracking-tight text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 sm:text-lg"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm transition group-hover:rotate-6">
            <Icon name="compass" size={18} />
          </span>
          <span className="tripfinder-wordmark hidden min-[360px]:inline">TripFinder</span>
        </Link>

        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/explore" && pathname.startsWith("/places"));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:px-4 ${
                      isActive
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-600 hover:bg-white hover:text-slate-950"
                    }`}
                  >
                    <span className="sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      {pathname === "/" ? (
        <nav aria-label="홈 빠른 이동" className="border-t border-line/60 bg-white/70">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-5 lg:px-8">
            <span className="mr-1 shrink-0 text-xs font-semibold text-slate-500">바로 찾기</span>
            <a href="#region-heading" className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">지역별</a>
            <a href="#category-heading" className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">테마별</a>
            <Link href="/bookmarks" className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">저장한 여행지</Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
};
