"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/Icon";

const NAV_ITEMS = [
  {
    href: "/explore",
    label: "여행지 탐색",
    shortLabel: "탐색",
    icon: "compass",
  },
  {
    href: "/bookmarks",
    label: "관심 여행지",
    shortLabel: "관심",
    icon: "bookmark",
  },
] as const;

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-5 lg:px-8">
        <Link
          href="/"
          aria-label="TripFinder 홈"
          className="group inline-flex min-w-0 items-center gap-2.5 text-lg font-bold tracking-tight text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 sm:text-xl"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm shadow-sky-900/15 transition group-hover:rotate-6 sm:size-10">
            <Icon name="compass" size={21} />
          </span>
          <span className="tripfinder-wordmark hidden min-[360px]:inline">
            TripFinder
          </span>
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
                    className={`relative inline-flex min-h-11 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:px-5 sm:text-base ${
                      isActive
                        ? "border-blue-700/20 bg-gradient-to-r from-brand to-blue-700 text-white shadow-[var(--shadow-nav-active)]"
                        : "border-transparent text-slate-600 hover:border-blue-100 hover:bg-brand-soft hover:text-brand-strong"
                    }`}
                  >
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent"
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className={`relative hidden size-7 place-items-center rounded-full sm:grid ${isActive ? "bg-white/15" : "bg-blue-50 text-brand"}`}
                    >
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span className="relative sm:hidden">
                      {item.shortLabel}
                    </span>
                    <span className="relative hidden sm:inline">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      {pathname === "/" ? (
        <nav
          aria-label="홈 빠른 이동"
          className="border-t border-line/60 bg-white/70"
        >
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2.5 overflow-x-auto px-4 py-2.5 sm:px-5 lg:px-8">
            <span className="mr-1 shrink-0 text-sm font-semibold text-slate-500">
              빠른 이동
            </span>
            <a
              href="#region-heading"
              className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              지역별
            </a>
            <a
              href="#category-heading"
              className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              테마별
            </a>
            <Link
              href="/bookmarks"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Icon name="bookmark" size={15} />
              관심 여행지
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
};
