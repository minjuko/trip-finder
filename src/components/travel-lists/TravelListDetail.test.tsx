import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import { TravelListDetail } from "./TravelListDetail";

const list = {
  id: "8b06daf5-e61b-4b35-99df-4a30b0cd611c",
  name: "부산 여행",
  version: 3,
  createdAt: "2026-11-20T00:00:00.000Z",
  updatedAt: "2026-11-20T00:00:00.000Z",
};
const savedItem = {
  id: "c5923214-e6e8-4d25-95bc-f6dc7b40ec27",
  contentId: "125266",
  contentTypeId: "12",
  title: "해운대 해수욕장",
  address: "부산 해운대구",
  thumbnailUrl: null,
  position: 0,
  createdAt: "2026-11-20T00:00:00.000Z",
};

afterEach(() => vi.unstubAllGlobals());

describe("TravelListDetail", () => {
  it("uses actual itemCount, removes with If-Match, and refreshes after mutation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(list))
      .mockResolvedValueOnce(
        Response.json({
          items: [savedItem],
          nextCursor: null,
          listVersion: 3,
          itemCount: 1,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ ...list, version: 4 }))
      .mockResolvedValueOnce(
        Response.json({
          items: [],
          nextCursor: null,
          listVersion: 4,
          itemCount: 0,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TravelListDetail listId={list.id} />);
    expect(
      await screen.findByRole("link", { name: /해운대 해수욕장/ }),
    ).toHaveAttribute("href", "/places/125266");
    expect(screen.getByText("저장된 장소 1개")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "제거" }));
    expect(
      await screen.findByRole("alertdialog", { name: "여행지를 제거할까요?" }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(
        screen.getByRole("alertdialog", { name: "여행지를 제거할까요?" }),
      ).getByRole("button", { name: "제거" }),
    );

    await waitFor(() =>
      expect(screen.getByText("저장된 장소 0개")).toBeInTheDocument(),
    );
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: "DELETE",
      headers: { "If-Match": '"list-v3"' },
    });
    expect(
      screen.getByText("아직 저장한 여행지가 없습니다."),
    ).toBeInTheDocument();
  });

  it("re-reads the first page after a stale cursor", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(list))
      .mockResolvedValueOnce(
        Response.json({
          items: [savedItem],
          nextCursor: "cursor-2",
          listVersion: 3,
          itemCount: 2,
        }),
      )
      .mockResolvedValueOnce(
        Response.json(
          { error: { code: "CURSOR_STALE", message: "stale" } },
          { status: 409 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ ...list, version: 4 }))
      .mockResolvedValueOnce(
        Response.json({
          items: [savedItem],
          nextCursor: null,
          listVersion: 4,
          itemCount: 1,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TravelListDetail listId={list.id} />);
    await screen.findByText("저장된 장소 2개");
    fireEvent.click(screen.getByRole("button", { name: "장소 더 불러오기" }));

    expect(
      await screen.findByText(
        "최신 내용을 불러왔습니다. 확인한 뒤 다시 시도해 주세요.",
      ),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls[2][0]).toContain("cursor=cursor-2");
    expect(fetchMock.mock.calls[4][0]).toContain("limit=20");
  });

  it("keeps an item and asks for a new decision after a stale delete", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(list))
      .mockResolvedValueOnce(
        Response.json({
          items: [savedItem],
          nextCursor: null,
          listVersion: 3,
          itemCount: 1,
        }),
      )
      .mockResolvedValueOnce(
        Response.json(
          { error: { code: "PRECONDITION_FAILED", message: "stale" } },
          { status: 412 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ ...list, version: 4 }))
      .mockResolvedValueOnce(
        Response.json({
          items: [savedItem],
          nextCursor: null,
          listVersion: 4,
          itemCount: 1,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TravelListDetail listId={list.id} />);
    await screen.findByRole("link", { name: /해운대 해수욕장/ });
    fireEvent.click(screen.getByRole("button", { name: "제거" }));
    const dialog = await screen.findByRole("alertdialog", {
      name: "여행지를 제거할까요?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "제거" }));

    expect(
      await screen.findByText(
        "최신 내용을 불러왔습니다. 확인한 뒤 다시 시도해 주세요.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /해운대 해수욕장/ }),
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE"),
    ).toHaveLength(1);
  });
});
