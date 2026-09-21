"use client";

import {
  type ChangeEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import type { RegionOption } from "@/types/tour";

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

  const [districts, setDistricts] = useState<
    RegionOption[]
  >([]);

  const [isLoadingDistricts, setIsLoadingDistricts] =
    useState(false);

  const [districtLoadFailed, setDistrictLoadFailed] =
    useState(false);
  const [districtSource, setDistrictSource] = useState<
    string | null
  >(null);

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
          `/api/regions/${encodeURIComponent(
            initialRegion,
          )}/districts`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load districts",
          );
        }

        const data =
          (await response.json()) as RegionOption[];

        setDistricts(data);
        setDistrictSource(initialRegion);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
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

  const visibleDistricts =
    districtSource === initialRegion ? districts : [];
  const visibleDistrictLoadFailed =
    districtSource === initialRegion
      ? districtLoadFailed
      : false;

  const navigateWithParams = (
    params: URLSearchParams,
  ) => {
    const queryString = params.toString();

    router.push(
      queryString
        ? `/explore?${queryString}`
        : "/explore",
    );
  };

  const handleRegionChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const regionCode = event.target.value;

    const params = new URLSearchParams(
      window.location.search,
    );

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

  const handleDistrictChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const districtCode = event.target.value;

    const params = new URLSearchParams(
      window.location.search,
    );

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
      <legend>지역</legend>

      <div>
        <label htmlFor="explore-region">
          시·도
        </label>

        <select
          id="explore-region"
          value={initialRegion ?? ""}
          onChange={handleRegionChange}
        >
          <option value="">전체 지역</option>

          {regions.map((region) => (
            <option
              key={region.code}
              value={region.code}
            >
              {region.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="explore-district">
          시·군·구
        </label>

        <select
          id="explore-district"
          value={initialDistrict ?? ""}
          onChange={handleDistrictChange}
          disabled={
            !initialRegion ||
            isLoadingDistricts ||
            visibleDistrictLoadFailed
          }
        >
          <option value="">
            {isLoadingDistricts
              ? "불러오는 중..."
              : "전체 시·군·구"}
          </option>

          {visibleDistricts.map((district) => (
            <option
              key={district.code}
              value={district.code}
            >
              {district.name}
            </option>
          ))}
        </select>

        {visibleDistrictLoadFailed ? (
          <p role="alert">
            시·군·구 정보를 불러오지 못했습니다.
          </p>
        ) : null}
      </div>
    </fieldset>
  );
};
