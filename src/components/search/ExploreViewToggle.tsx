"use client";

import { useRouter } from "next/navigation";\n\nimport { Icon, type IconName } from "@/components/ui/Icon";

interface ExploreViewToggleProps {
  view: "grid" | "list" | "map";
}

export const ExploreViewToggle = ({
  view,
}: ExploreViewToggleProps) => {
  const router = useRouter();

  const changeView = (nextView: "grid" | "list" | "map") => {
    const params = new URLSearchParams(window.location.search);
    if (nextView === "grid") {
      params.delete("view");
    } else {
      params.set("view", nextView);
    }

    const queryString = params.toString();
    router.push(queryString ? `/explore?${queryString}` : "/explore");
  };

  return (
    <div className="inline-flex rounded-xl border border-line bg-white p-1 shadow-sm" aria-label="결과 보기 방식">
      {(["grid", "list", "map"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={view === option}
          aria-label={
            option === "grid"
              ? "카드형으로 보기"
              : option === "list"
                ? "목록형으로 보기"
                : "지도로 보기"
          }
          onClick={() => changeView(option)}
          className={`grid size-9 place-items-center rounded-lg text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${view === option ? "bg-brand text-white" : "text-slate-500 hover:bg-surface-subtle hover:text-slate-900"}`}
        >
          <span aria-hidden="true">
            {option === "grid" ? "▦" : option === "list" ? "☰" : "⌖"}
          </span>
        </button>
      ))}
    </div>
  );
};
