"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { RegionOption } from "@/types/tour";
import { regionOptionResponseSchema } from "@/lib/search/option-schemas";

interface ExploreRegionFilterProps {
  regions: RegionOption[];
  initialRegion: string | null;
  initialDistrict: string | null;
}

export const ExploreRegionFilter = ({
  regions,
  initialRegion,
  initialDistrict,
}: ExploreRegionFilterProps) => {
  const router = useRouter();

  const [districts, setDistricts] = useState<RegionOption[]>([]);

  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const [districtLoadFailed, setDistrictLoadFailed] = useState(false);
  const [districtSource, setDistrictSource] = useState<string | null>(null);

  useEffect(() => {
    if (!initialRegion) {
      return;
    }

    const controller = new AbortController();

    const loadDistricts = async () => {
      setIsLoadingDistricts(true);
      setDistrictLoadFailed(false);

      try {
        const response = await fetch(
          `/api/regions/${encodeURIComponent(initialRegion)}/districts`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load districts");
        }

        const data = regionOptionResponseSchema.parse(
          await response.json(),
        ) as RegionOption[];

        setDistricts(data);
        setDistrictSource(initialRegion);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setDistricts([]);
        setDistrictLoadFailed(true);
        setDistrictSource(initialRegion);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDistricts(false);
        }
      }
    };

    void loadDistricts();

    return () => {
      controller.abort();
    };
  }, [initialRegion]);

  const visibleDistricts = districtSource === initialRegion ? districts : [];
  const visibleDistrictLoadFailed =
    districtSource === initialRegion ? districtLoadFailed : false;

  const navigateWithParams = (params: URLSearchParams) => {
    const queryString = params.toString();

    router.push(queryString ? `/explore?${queryString}` : "/explore", {
      scroll: false,
    });
  };

  const handleRegionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const regionCode = event.target.value;

    const params = new URLSearchParams(window.location.search);

    if (regionCode) {
      params.set("region", regionCode);
    } else {
      params.delete("region");
    }

    // 변경: 지역 변경 시 종속 시군구 제거
    params.delete("district");

    // 변경: 필터 변경 시 첫 페이지로 초기화
    params.delete("page");

    navigateWithParams(params);
  };

  const handleDistrictChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const districtCode = event.target.value;

    const params = new URLSearchParams(window.location.search);

    if (districtCode) {
      params.set("district", districtCode);
    } else {
      params.delete("district");
    }

    // 변경: 필터 변경 시 첫 페이지로 초기화
    params.delete("page");

    navigateWithParams(params);
  };

  return (
    <fieldset>
      {/* 변경: sidebar용 fieldset 스타일 */}
      <legend className="mb-3 text-sm font-semibold text-slate-900">
        지역
      </legend>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="explore-region"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            시·도
          </label>

          <select
            id="explore-region"
            value={initialRegion ?? ""}
            onChange={handleRegionChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">전체 지역</option>

            {regions.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="explore-district"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            시·군·구
          </label>

          <select
            id="explore-district"
            value={initialDistrict ?? ""}
            onChange={handleDistrictChange}
            disabled={
              !initialRegion || isLoadingDistricts || visibleDistrictLoadFailed
            }
            // 변경: disabled 상태를 시각적으로 구분
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-700"
          >
            <option value="">
              {isLoadingDistricts ? "불러오는 중..." : "전체 시·군·구"}
            </option>

            {visibleDistricts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>

          {visibleDistrictLoadFailed ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              시·군·구 정보를 불러오지 못했습니다.
            </p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
};
