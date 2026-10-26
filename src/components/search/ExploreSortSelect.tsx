"use client";

import { useRouter } from "next/navigation";

import type { ExploreQuery } from "@/lib/search/explore-query";

type ExploreSortSelectProps = Pick<ExploreQuery, "sort" | "imageOnly">;

const ExploreSortSelect = ({ sort, imageOnly }: ExploreSortSelectProps) => {
  const router = useRouter();

  const updateQuery = (update: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(window.location.search);
    update(params);
    params.delete("page");

    const queryString = params.toString();
    router.push(queryString ? `/explore?${queryString}` : "/explore", {
      scroll: false,
    });
  };

  return (
    <div
      aria-label="검색 결과 정렬 및 이미지 필터"
      className="flex flex-wrap items-center gap-3"
    >
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
        <span>정렬 기준</span>
        <select
          key={sort}
          name="sort"
          aria-label="정렬 기준"
          defaultValue={sort}
          onChange={(event) =>
            updateQuery((params) => params.set("sort", event.target.value))
          }
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          <option value="title">제목순</option>
          <option value="modified">수정일 기준</option>
          <option value="created">생성일 기준</option>
        </select>
      </label>

      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
        <input
          key={String(imageOnly)}
          type="checkbox"
          name="imageOnly"
          value="1"
          defaultChecked={imageOnly}
          onChange={(event) =>
            updateQuery((params) => {
              if (event.target.checked) {
                params.set("imageOnly", "1");
              } else {
                params.delete("imageOnly");
              }
            })
          }
          className="size-4 accent-sky-700"
        />
        대표 이미지가 있는 결과만
      </label>
    </div>
  );
};

export { ExploreSortSelect };
