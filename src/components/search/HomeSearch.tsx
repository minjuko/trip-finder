"use client";

import {
  type FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export const HomeSearch = () => {
  const router = useRouter();

  // 변경: Home 검색 입력에 필요한 최소 Client state만 관리
  const [keyword, setKeyword] =
    useState("");

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const normalizedKeyword =
      keyword.trim();

    if (!normalizedKeyword) {
      router.push("/explore");
      return;
    }

    const params = new URLSearchParams({
      keyword: normalizedKeyword,
    });

    // 변경: 기존 Explore URL Search Params 계약 재사용
    router.push(
      `/explore?${params.toString()}`,
    );
  };

  return (
    <form
      role="search"
      aria-label="여행지 검색"
      onSubmit={handleSubmit}
      className="mx-auto mt-8 max-w-2xl"
    >
      <label
        htmlFor="home-keyword"
        className="sr-only"
      >
        여행지 검색
      </label>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row">
        <input
          id="home-keyword"
          name="keyword"
          type="search"
          value={keyword}
          onChange={(event) =>
            setKeyword(
              event.target.value,
            )
          }
          placeholder="여행지나 관광 콘텐츠를 검색해보세요"
          className="min-w-0 flex-1 rounded-xl px-4 py-3 text-base text-slate-950 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-950"
        />

        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
        >
          검색
        </button>
      </div>
    </form>
  );
};