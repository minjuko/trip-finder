import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TourContent } from "@/types/tour";

import { TourList } from "./TourList";

const content: TourContent = {
  id: "126508",
  contentTypeId: "12",
  title: "경복궁",
  address: {
    primary: "서울특별시 종로구 사직로 161",
    detail: null,
    zipCode: "03045",
  },
  thumbnail: null,
  region: {
    regionCode: "11",
    districtCode: "110",
  },
  classification: {
    depth1: "HS",
    depth2: "HS01",
    depth3: "HS010100",
  },
  coordinates: null,
};

describe("TourList", () => {
  it("renders tour contents as a list", () => {
    render(
      <TourList
        contents={[
          content,
          {
            ...content,
            id: "126509",
            title: "창덕궁",
          },
        ]}
      />,
    );

    expect(screen.getByRole("list")).toBeInTheDocument();

    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    expect(screen.getByText("경복궁")).toBeInTheDocument();

    expect(screen.getByText("창덕궁")).toBeInTheDocument();
  });

  it("renders an explicit empty state", () => {
    render(<TourList contents={[]} />);

    expect(
      screen.getByText("조건에 맞는 여행지가 없습니다."),
    ).toBeInTheDocument();

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
