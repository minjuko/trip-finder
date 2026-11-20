import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { TravelListThumbnail } from "./TravelListThumbnail";

describe("TravelListThumbnail", () => {
  it.each(["http", "https"])(
    "renders a %s TourAPI snapshot URL accepted by next.config.ts",
    (protocol) => {
      const { container } = render(
        <TravelListThumbnail
          src={`${protocol}://tong.visitkorea.or.kr/cms/resource/28/3572128_image2_1.jpg`}
          title="가거도"
        />,
      );

      expect(container.querySelector("img")).toBeInTheDocument();
      expect(screen.queryByText("이미지 없음")).not.toBeInTheDocument();
    },
  );

  it.each([
    "https://images.example.test/cms/resource/28/image.jpg",
    "https://tong.visitkorea.or.kr/unexpected/image.jpg",
    "ftp://tong.visitkorea.or.kr/cms/resource/28/image.jpg",
    "https://tong.visitkorea.or.kr:8443/cms/resource/28/image.jpg",
  ])("uses a safe placeholder for unsupported URL %s", (src) => {
    const { container } = render(
      <TravelListThumbnail src={src} title="가거도" />,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("이미지 없음")).toBeInTheDocument();
  });

  it("uses a safe placeholder when a snapshot has no image", () => {
    const { container } = render(
      <TravelListThumbnail src={null} title="가거도" />,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("이미지 없음")).toBeInTheDocument();
  });
});
