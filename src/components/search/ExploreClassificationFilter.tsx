"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ClassificationOption } from "@/types/tour";
import { classificationOptionResponseSchema } from "@/lib/search/option-schemas";

interface ExploreClassificationFilterProps {
  depth1Options: ClassificationOption[];
  initialDepth1: string | null;
  initialDepth2: string | null;
  initialDepth3: string | null;
}

export const ExploreClassificationFilter = ({
  depth1Options,
  initialDepth1,
  initialDepth2,
  initialDepth3,
}: ExploreClassificationFilterProps) => {
  const router = useRouter();

  // 변경: URL의 상위 분류에 종속되는 option만 Client state로 관리
  const [depth2Options, setDepth2Options] = useState<ClassificationOption[]>(
    [],
  );

  const [depth3Options, setDepth3Options] = useState<ClassificationOption[]>(
    [],
  );

  const [isLoadingDepth2, setIsLoadingDepth2] = useState(false);

  const [isLoadingDepth3, setIsLoadingDepth3] = useState(false);

  const [depth2LoadFailed, setDepth2LoadFailed] = useState(false);

  const [depth3LoadFailed, setDepth3LoadFailed] = useState(false);
  const [depth2Source, setDepth2Source] = useState<string | null>(null);
  const [depth3Source, setDepth3Source] = useState<string | null>(null);

  // 변경: 1단계 선택 시 2단계 option 조회
  useEffect(() => {
    if (!initialDepth1) {
      return;
    }

    const controller = new AbortController();

    const loadDepth2Options = async () => {
      setIsLoadingDepth2(true);
      setDepth2LoadFailed(false);

      try {
        const params = new URLSearchParams({
          depth1: initialDepth1,
        });

        const response = await fetch(
          `/api/classifications?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load depth2 classifications");
        }

        const data = classificationOptionResponseSchema.parse(
          await response.json(),
        ) as ClassificationOption[];

        setDepth2Options(data);
        setDepth2Source(initialDepth1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setDepth2Options([]);
        setDepth2LoadFailed(true);
        setDepth2Source(initialDepth1);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDepth2(false);
        }
      }
    };

    void loadDepth2Options();

    return () => {
      controller.abort();
    };
  }, [initialDepth1]);

  // 변경: 1·2단계 선택 시 3단계 option 조회
  useEffect(() => {
    if (!initialDepth1 || !initialDepth2) {
      return;
    }

    const controller = new AbortController();

    const loadDepth3Options = async () => {
      setIsLoadingDepth3(true);
      setDepth3LoadFailed(false);

      try {
        const params = new URLSearchParams({
          depth1: initialDepth1,
          depth2: initialDepth2,
        });

        const response = await fetch(
          `/api/classifications?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load depth3 classifications");
        }

        const data = (await response.json()) as ClassificationOption[];

        setDepth3Options(data);
        setDepth3Source(`${initialDepth1}:${initialDepth2}`);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setDepth3Options([]);
        setDepth3LoadFailed(true);
        setDepth3Source(`${initialDepth1}:${initialDepth2}`);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDepth3(false);
        }
      }
    };

    void loadDepth3Options();

    return () => {
      controller.abort();
    };
  }, [initialDepth1, initialDepth2]);

  const visibleDepth2Options =
    depth2Source === initialDepth1 ? depth2Options : [];
  const visibleDepth2LoadFailed =
    depth2Source === initialDepth1 ? depth2LoadFailed : false;
  const depth3Key =
    initialDepth1 && initialDepth2 ? `${initialDepth1}:${initialDepth2}` : null;
  const visibleDepth3Options = depth3Source === depth3Key ? depth3Options : [];
  const visibleDepth3LoadFailed =
    depth3Source === depth3Key ? depth3LoadFailed : false;

  const navigateWithParams = (params: URLSearchParams) => {
    const queryString = params.toString();

    router.push(queryString ? `/explore?${queryString}` : "/explore", {
      scroll: false,
    });
  };

  const handleDepth1Change = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    const params = new URLSearchParams(window.location.search);

    if (value) {
      params.set("category1", value);
    } else {
      params.delete("category1");
    }

    // 변경: 상위 분류 변경 시 하위 분류 무효화
    params.delete("category2");
    params.delete("category3");
    params.delete("page");

    navigateWithParams(params);
  };

  const handleDepth2Change = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    const params = new URLSearchParams(window.location.search);

    if (value) {
      params.set("category2", value);
    } else {
      params.delete("category2");
    }

    // 변경: 2단계 변경 시 3단계 무효화
    params.delete("category3");
    params.delete("page");

    navigateWithParams(params);
  };

  const handleDepth3Change = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    const params = new URLSearchParams(window.location.search);

    if (value) {
      params.set("category3", value);
    } else {
      params.delete("category3");
    }

    params.delete("page");

    navigateWithParams(params);
  };

  return (
    <fieldset>
      {/* 변경: sidebar용 카테고리 필터 */}
      <legend className="mb-3 text-sm font-semibold text-slate-900">
        카테고리
      </legend>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="explore-category1"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            대분류
          </label>

          <select
            id="explore-category1"
            value={initialDepth1 ?? ""}
            onChange={handleDepth1Change}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          >
            <option value="">전체 카테고리</option>

            {depth1Options.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="explore-category2"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            중분류
          </label>

          <select
            id="explore-category2"
            value={initialDepth2 ?? ""}
            onChange={handleDepth2Change}
            disabled={
              !initialDepth1 || isLoadingDepth2 || visibleDepth2LoadFailed
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-700"
          >
            <option value="">
              {isLoadingDepth2 ? "불러오는 중..." : "전체 중분류"}
            </option>

            {visibleDepth2Options.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>

          {visibleDepth2LoadFailed ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              중분류 정보를 불러오지 못했습니다.
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="explore-category3"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            소분류
          </label>

          <select
            id="explore-category3"
            value={initialDepth3 ?? ""}
            onChange={handleDepth3Change}
            disabled={
              !initialDepth1 ||
              !initialDepth2 ||
              isLoadingDepth3 ||
              visibleDepth3LoadFailed
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-700"
          >
            <option value="">
              {isLoadingDepth3 ? "불러오는 중..." : "전체 소분류"}
            </option>

            {visibleDepth3Options.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>

          {visibleDepth3LoadFailed ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              소분류 정보를 불러오지 못했습니다.
            </p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
};
