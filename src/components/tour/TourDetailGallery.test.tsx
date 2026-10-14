import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TourDetailGallery } from "./TourDetailGallery";

describe("TourDetailGallery", () => {
  it("traps focus, closes with Escape, restores focus, and locks background scroll", async () => {
    render(
      <TourDetailGallery
        title="경복궁"
        thumbnail={{
          url: "https://example.com/gyeongbokgung.jpg",
          copyrightType: null,
        }}
        images={[]}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "경복궁 대표 이미지 크게 보기",
    });
    trigger.focus();
    fireEvent.click(trigger);

    const closeButton = screen.getByRole("button", { name: "이미지 닫기" });
    expect(closeButton).toHaveFocus();
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    fireEvent.keyDown(window, { key: "Tab" });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});
