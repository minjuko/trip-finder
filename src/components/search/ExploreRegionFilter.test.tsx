import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExploreRegionFilter } from "./ExploreRegionFilter";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

const regions = [
  {
    code: "11",
    name: "서울특별시",
  },
  {
    code: "26",
    name: "부산광역시",
  },
];

describe("ExploreRegionFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.history.replaceState({}, "", "/explore");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );
  });

  it("renders region options", () => {
    render(
      <ExploreRegionFilter
        regions={regions}
        initialRegion={null}
        initialDistrict={null}
      />,
    );

    expect(
      screen.getByRole("option", {
        name: "서울특별시",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "부산광역시",
      }),
    ).toBeInTheDocument();
  });

  // 변경: 상위 지역 변경 시 district와 page를 제거
  it("updates the region and resets dependent URL parameters", () => {
    window.history.replaceState(
      {},
      "",
      "/explore?district=110&keyword=%EA%B2%BD%EB%B3%B5%EA%B6%81&page=4",
    );

    render(
      <ExploreRegionFilter
        regions={regions}
        initialRegion={null}
        initialDistrict={null}
      />,
    );

    fireEvent.change(screen.getByLabelText("시·도"), {
      target: {
        value: "11",
      },
    });

    expect(push).toHaveBeenCalledOnce();

    const destination = push.mock.calls[0][0] as string;

    const url = new URL(destination, "http://localhost");

    expect(url.searchParams.get("region")).toBe("11");

    expect(url.searchParams.has("district")).toBe(false);

    expect(url.searchParams.has("page")).toBe(false);

    // 변경: 지역과 무관한 검색 조건은 보존
    expect(url.searchParams.get("keyword")).toBe("경복궁");
  });

  it("removes the region when all regions are selected", () => {
    window.history.replaceState(
      {},
      "",
      "/explore?region=11&district=110&page=2",
    );

    render(
      <ExploreRegionFilter
        regions={regions}
        initialRegion="11"
        initialDistrict="110"
      />,
    );

    fireEvent.change(screen.getByLabelText("시·도"), {
      target: {
        value: "",
      },
    });

    const destination = push.mock.calls[0][0] as string;

    const url = new URL(destination, "http://localhost");

    expect(url.searchParams.has("region")).toBe(false);

    expect(url.searchParams.has("district")).toBe(false);

    expect(url.searchParams.has("page")).toBe(false);
  });

  // 변경: initialRegion이 있으면 내부 API를 통해 시군구 조회
  it("loads district options for the selected region", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          code: "110",
          name: "종로구",
        },
        {
          code: "140",
          name: "중구",
        },
      ],
    } as Response);

    render(
      <ExploreRegionFilter
        regions={regions}
        initialRegion="11"
        initialDistrict="110"
      />,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/regions/11/districts",
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    expect(
      await screen.findByRole("option", {
        name: "종로구",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "중구",
      }),
    ).toBeInTheDocument();
  });

  // 변경: 시군구 선택도 다른 URL 조건을 보존하고 page만 초기화
  it("updates the district parameter", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          code: "110",
          name: "종로구",
        },
      ],
    } as Response);

    window.history.replaceState(
      {},
      "",
      "/explore?region=11&keyword=%EA%B2%BD%EB%B3%B5%EA%B6%81&page=3",
    );

    render(
      <ExploreRegionFilter
        regions={regions}
        initialRegion="11"
        initialDistrict={null}
      />,
    );

    const districtSelect = screen.getByLabelText("시·군·구");

    await waitFor(() => {
      expect(districtSelect).not.toBeDisabled();
    });

    fireEvent.change(districtSelect, {
      target: {
        value: "110",
      },
    });

    const destination = push.mock.calls[0][0] as string;

    const url = new URL(destination, "http://localhost");

    expect(url.searchParams.get("region")).toBe("11");

    expect(url.searchParams.get("district")).toBe("110");

    expect(url.searchParams.get("keyword")).toBe("경복궁");

    expect(url.searchParams.has("page")).toBe(false);
  });

  it("shows an error when district loading fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(
      <ExploreRegionFilter
        regions={regions}
        initialRegion="11"
        initialDistrict={null}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "시·군·구 정보를 불러오지 못했습니다.",
    );
  });
});
