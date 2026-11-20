import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import { TravelListsHome } from "./TravelListsHome";

afterEach(() => vi.unstubAllGlobals());

describe("TravelListsHome", () => {
  it("hides list mutation controls when auth is disabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: { code: "AUTH_DISABLED", message: "private config" } },
            { status: 503 },
          ),
        ),
    );

    render(<TravelListsHome />);

    expect(
      await screen.findByText("계정 여행 목록을 준비 중입니다"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("새 목록 이름")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "목록 만들기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/실제 Google 로그인은 아직 제공되지 않습니다/),
    ).toBeInTheDocument();
  });

  it("creates a list once and shows the returned list", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ items: [], nextCursor: null }))
      .mockResolvedValueOnce(
        Response.json(
          {
            id: "8b06daf5-e61b-4b35-99df-4a30b0cd611c",
            name: "제주 여행",
            version: 1,
            createdAt: "2026-11-20T00:00:00.000Z",
            updatedAt: "2026-11-20T00:00:00.000Z",
          },
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({
          items: [
            {
              id: "8b06daf5-e61b-4b35-99df-4a30b0cd611c",
              name: "제주 여행",
              version: 1,
              createdAt: "2026-11-20T00:00:00.000Z",
              updatedAt: "2026-11-20T00:00:00.000Z",
            },
          ],
          nextCursor: null,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TravelListsHome />);
    const input = await screen.findByLabelText("새 목록 이름");
    fireEvent.change(input, { target: { value: "제주 여행" } });
    fireEvent.click(screen.getByRole("button", { name: "목록 만들기" }));

    expect(
      await screen.findByRole("link", { name: /제주 여행/ }),
    ).toHaveAttribute(
      "href",
      "/travel-lists/8b06daf5-e61b-4b35-99df-4a30b0cd611c",
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST" });
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(1);
  });

  it("renames with the expected version and confirms before deleting", async () => {
    const list = {
      id: "8b06daf5-e61b-4b35-99df-4a30b0cd611c",
      name: "처음 이름",
      version: 4,
      createdAt: "2026-11-20T00:00:00.000Z",
      updatedAt: "2026-11-20T00:00:00.000Z",
    };
    const updated = { ...list, name: "바꾼 이름", version: 5 };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ items: [list], nextCursor: null }))
      .mockResolvedValueOnce(Response.json(updated))
      .mockResolvedValueOnce(
        Response.json({ items: [updated], nextCursor: null }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ items: [], nextCursor: null }));
    vi.stubGlobal("fetch", fetchMock);

    render(<TravelListsHome />);
    await screen.findByRole("link", { name: /처음 이름/ });
    fireEvent.click(screen.getByRole("button", { name: "이름 변경" }));
    await screen.findByRole("dialog", { name: "목록 이름 변경" });
    const editInput = screen.getByLabelText("새 목록 이름", {
      selector: "input#edit-list-name",
    });
    fireEvent.change(editInput, { target: { value: "바꾼 이름" } });
    fireEvent.click(screen.getByRole("button", { name: "변경 저장" }));

    expect(
      await screen.findByRole("link", { name: /바꾼 이름/ }),
    ).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ name: "바꾼 이름", expectedVersion: 4 }),
    });

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(
      await screen.findByRole("dialog", { name: "목록을 삭제할까요?" }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "목록을 삭제할까요?" }),
      ).getByRole("button", { name: "목록 삭제" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: /바꾼 이름/ }),
      ).not.toBeInTheDocument(),
    );
    expect(fetchMock.mock.calls[3][1]).toMatchObject({ method: "DELETE" });
  });
});
