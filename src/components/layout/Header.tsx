import Link from "next/link";\n\nimport { Icon } from "@/components/ui/Icon";

export const Header = () => {
  return (
    // 변경: 모든 route에서 공유하는 서비스 navigation
    <header className="sticky top-0 z-30 border-b border-line/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-brand text-white shadow-sm transition group-hover:rotate-6"><Icon name="sparkles" size={17} /></span>
          TripFinder
        </Link>

        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-1 sm:gap-2">
            <li>
              <Link
                href="/explore"
                className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                여행지 탐색
              </Link>
            </li>

            <li>
              <Link
                href="/bookmarks"
                className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                저장한 여행지
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
