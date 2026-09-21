"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface ExploreSearchProps {
  initialKeyword: string | null;
}

export const ExploreSearch = ({ initialKeyword }: ExploreSearchProps) => {
  const router = useRouter();

  // 변경: 입력 중인 값만 Client Component의 local state로 관리
  const [keyword, setKeyword] = useState(initialKeyword ?? "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 변경: 현재 URL의 기존 지역/분류 조건을 보존
    const params = new URLSearchParams(window.location.search);

    const normalizedKeyword = keyword.trim();

    if (normalizedKeyword) {
      params.set("keyword", normalizedKeyword);
    } else {
      params.delete("keyword");
    }

    // 변경: 검색 조건이 변경되면 첫 페이지부터 다시 조회
    params.delete("page");

    const queryString = params.toString();

    router.push(queryString ? `/explore?${queryString}` : "/explore");
  };

  return (
    <form role="search" aria-label="관광 콘텐츠 검색" onSubmit={handleSubmit}>
      <label htmlFor="explore-keyword">여행지 검색</label>

      <div>
        <input
          id="explore-keyword"
          name="keyword"
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="여행지나 관광 콘텐츠를 검색해보세요"
        />

        <button type="submit">검색</button>
      </div>
    </form>
  );
};
