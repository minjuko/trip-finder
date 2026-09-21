import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TourContent } from "@/types/tour";

import { TourCard } from "./TourCard";

const content: TourContent = {
  id: "126508",
  contentTypeId: "12",
  title: "경복궁",
  address: {
    primary: "서울특별시 종로구 사직로 161",
    detail: null,
    zipCode: "03045",
  },
  thumbnail: {
    url: "https://example.com/gyeongbokgung.jpg",
    copyrightType: "Type1",
  },
  region: {
    regionCode: "11",
    districtCode: "110",
  },
  classification: {
    depth1: "HS",
    depth2: "HS01",
    depth3: "HS010100",
  },
  coordinates: {
    latitude: 37.579617,
    longitude: 126.977041,
  },
};

describe("TourCard", () => {
  it("renders the title and address", () => {
    render(<TourCard content={content} />);

    expect(
      screen.getByRole("heading", {
        name: "경복궁",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("서울특별시 종로구 사직로 161"),
    ).toBeInTheDocument();
  });

  it("links to the place detail page", () => {
    render(<TourCard content={content} />);

    expect(
      screen.getByRole("link", {
        name: "경복궁 상세정보 보기",
      }),
    ).toHaveAttribute(
      "href",
      "/places/126508",
    );
  });

  it("renders a fallback when the thumbnail is missing", () => {
    render(
      <TourCard
        content={{
          ...content,
          thumbnail: null,
        }}
      />,
    );

    expect(
      screen.getByText("이미지 없음"),
    ).toBeInTheDocument();
  });

  it("renders a fallback when the address is missing", () => {
    render(
      <TourCard
        content={{
          ...content,
          address: null,
        }}
      />,
    );

    expect(
      screen.getByText("주소 정보 없음"),
    ).toBeInTheDocument();
  });
});