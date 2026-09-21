"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface ExploreSearchProps {
  initialKeyword: string | null;
}

export const ExploreSearch = ({ initialKeyword }: ExploreSearchProps) => {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialKeyword ?? "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const normalizedKeyword = keyword.trim();

    if (normalizedKeyword) {
      params.set("keyword", normalizedKeyword);
    } else {
      params.delete("keyword");
    }

    params.delete("page");

    const queryString = params.toString();
    router.push(queryString ? `/explore?${queryString}` : "/explore");
  };

  return (
    <form
      role="search"
      aria-label="관광 콘텐츠 검색"
      onSubmit={handleSubmit}
      className="max-w-3xl"
    >
      <label htmlFor="explore-keyword" className="sr-only">
        여행지 검색
      </label>

      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition focus-within:border-teal-300 focus-within:shadow-md">
        <input
          id="explore-keyword"
          name="keyword"
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="여행지나 관광 콘텐츠를 검색해보세요"
          className="min-w-0 flex-1 rounded-xl px-4 py-3 text-base text-slate-950 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-brand/20"
        />

        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          검색
        </button>
      </div>
    </form>
  );
};
