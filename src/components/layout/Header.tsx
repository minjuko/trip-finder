import Link from "next/link";

export const Header = () => {
  return (
    // 변경: 모든 route에서 공유하는 서비스 navigation
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-4"
        >
          TripFinder
        </Link>

        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-1 sm:gap-2">
            <li>
              <Link
                href="/explore"
                className="inline-flex rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                여행지 탐색
              </Link>
            </li>

            <li>
              <Link
                href="/bookmarks"
                className="inline-flex rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
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