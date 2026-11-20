import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { TourContentDetail } from "@/types/tour";

import { AddToTravelListButton } from "./AddToTravelListButton";

const content: TourContentDetail = {
  id: "125266",
  contentTypeId: "12",
  title: "해운대 해수욕장",
  address: { primary: "부산 해운대구", detail: null, zipCode: null },
  thumbnail: null,
  region: null,
  classification: null,
  coordinates: null,
  homepage: null,
  phone: null,
  overview: null,
  images: [],
  information: [],
  repeatingInformation: [],
};

afterEach(() => vi.unstubAllGlobals());

describe("AddToTravelListButton", () => {
  it("reports auth disabled and never shows a fake sign-in path", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { error: { code: "AUTH_DISABLED", message: "internal" } },
          { status: 503 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<AddToTravelListButton content={content} />);
    fireEvent.click(screen.getByRole("button", { name: "여행 목록에 추가" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("비활성 상태");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("saves using the selected list version and keeps duplicate saves safe", async () => {
    const list = {
      id: "8b06daf5-e61b-4b35-99df-4a30b0cd611c",
      name: "부산",
      version: 6,
      createdAt: "2026-11-20T00:00:00.000Z",
      updatedAt: "2026-11-20T00:00:00.000Z",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ items: [list], nextCursor: null }))
      .mockResolvedValueOnce(
        Response.json({ item: { contentId: content.id }, listVersion: 6 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<AddToTravelListButton content={content} />);
    fireEvent.click(screen.getByRole("button", { name: "여행 목록에 추가" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "이 목록에 저장" }),
    );

    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "PUT",
      body: JSON.stringify({ contentTypeId: "12", expectedVersion: 6 }),
    });
  });

  it("refreshes a stale list version but waits for the user before retrying", async () => {
    const list = {
      id: "8b06daf5-e61b-4b35-99df-4a30b0cd611c",
      name: "부산",
      version: 6,
      createdAt: "2026-11-20T00:00:00.000Z",
      updatedAt: "2026-11-20T00:00:00.000Z",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ items: [list], nextCursor: null }))
      .mockResolvedValueOnce(
        Response.json(
          { error: { code: "VERSION_CONFLICT", message: "stale" } },
          { status: 409 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ ...list, version: 7 }))
      .mockResolvedValueOnce(
        Response.json(
          { item: { contentId: content.id }, listVersion: 7 },
          { status: 201 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<AddToTravelListButton content={content} />);
    fireEvent.click(screen.getByRole("button", { name: "여행 목록에 추가" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "이 목록에 저장" }),
    );

    expect(
      await screen.findByText(
        "목록이 다른 곳에서 변경되었습니다. 최신 목록 정보를 확인했습니다. 저장을 다시 눌러 주세요.",
      ),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "이 목록에 저장" }));
    await screen.findByRole("status");
    expect(fetchMock.mock.calls[3][1]).toMatchObject({
      method: "PUT",
      body: JSON.stringify({ contentTypeId: "12", expectedVersion: 7 }),
    });
  });
});
