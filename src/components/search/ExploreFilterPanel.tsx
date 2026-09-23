"use client";

import { type ReactNode, useEffect, useRef } from "react";

interface ExploreFilterPanelProps {
  activeFilterCount: number;
  children: ReactNode;
}

export const ExploreFilterPanel = ({
  activeFilterCount,
  children,
}: ExploreFilterPanelProps) => {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 64rem)");
    const syncOpenState = () => {
      if (detailsRef.current) {
        detailsRef.current.open = desktopQuery.matches;
      }
    };

    syncOpenState();
    desktopQuery.addEventListener("change", syncOpenState);

    return () => desktopQuery.removeEventListener("change", syncOpenState);
  }, []);

  return (
    <details ref={detailsRef} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-3xl p-5 text-lg font-bold tracking-tight text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 lg:hidden">
        <span className="flex items-center gap-2">
          필터
          {activeFilterCount > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </span>
        <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
          {activeFilterCount > 0 ? `${activeFilterCount}개 적용` : "조건 선택"}
          <span
            aria-hidden="true"
            className="text-xl font-normal transition group-open:rotate-180"
          >
            ⌄
          </span>
        </span>
      </summary>

      {children}
    </details>
  );
};
