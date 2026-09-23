"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export const HomeSearch = () => {
  const router = useRouter();

  // 변경: Home 검색 입력에 필요한 최소 Client state만 관리
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      router.push("/explore");
      return;
    }

    const params = new URLSearchParams({
      keyword: normalizedKeyword,
    });

    // 변경: 기존 Explore URL Search Params 계약 재사용
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <form
      role="search"
      aria-label="여행지 검색"
      onSubmit={handleSubmit}
      className="mt-9 max-w-2xl"
    >
      <label htmlFor="home-keyword" className="sr-only">
        여행지 검색
      </label>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-[var(--shadow-search)] sm:flex-row">
        <input
          id="home-keyword"
          name="keyword"
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="여행지 이름을 검색해 보세요"
          className="min-w-0 flex-1 rounded-xl px-4 py-3.5 text-base text-slate-950 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-brand sm:text-lg"
        />

        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white shadow-md shadow-sky-900/15 transition hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          검색
        </button>
      </div>
    </form>
  );
};
