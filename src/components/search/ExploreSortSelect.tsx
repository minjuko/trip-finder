"use client";

import { useRouter } from "next/navigation";

interface ExploreSortSelectProps {
  sort: "relevance" | "title";
}

export const ExploreSortSelect = ({
  sort,
}: ExploreSortSelectProps) => {
  const router = useRouter();

  const handleChange = (value: "relevance" | "title") => {
    const params = new URLSearchParams(window.location.search);
    if (value === "relevance") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    params.delete("page");

    const queryString = params.toString();
    router.push(queryString ? `/explore?${queryString}` : "/explore");
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className="sr-only">검색 결과 정렬</span>
      <select
        value={sort}
        onChange={(event) =>
          handleChange(event.target.value as "relevance" | "title")
        }
        className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        aria-label="검색 결과 정렬"
      >
        <option value="relevance">관련도순</option>
        <option value="title">가나다순</option>
      </select>
    </label>
  );
};
