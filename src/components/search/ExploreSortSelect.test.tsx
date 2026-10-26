import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExploreSortSelect } from "./ExploreSortSelect";

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

describe("ExploreSortSelect", () => {
  beforeEach(() => {
    routerPush.mockReset();
    window.history.replaceState(
      {},
      "",
      "/explore?region=11&district=110&category1=NA&keyword=Tour&view=list&page=4",
    );
  });

  it("updates sorting in the URL, preserves other conditions, and resets pagination", () => {
    render(<ExploreSortSelect sort="title" imageOnly={false} />);

    fireEvent.change(screen.getByLabelText("정렬 기준"), {
      target: { value: "modified" },
    });

    expect(routerPush).toHaveBeenCalledWith(
      "/explore?region=11&district=110&category1=NA&keyword=Tour&view=list&sort=modified",
      { scroll: false },
    );
  });

  it("adds and removes imageOnly while preserving the selected sort", () => {
    window.history.replaceState(
      {},
      "",
      "/explore?region=11&sort=created&page=3",
    );
    const { rerender } = render(
      <ExploreSortSelect sort="created" imageOnly={false} />,
    );

    fireEvent.click(screen.getByRole("checkbox"));
    expect(routerPush).toHaveBeenLastCalledWith(
      "/explore?region=11&sort=created&imageOnly=1",
      { scroll: false },
    );

    routerPush.mockClear();
    rerender(<ExploreSortSelect sort="created" imageOnly />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(routerPush).toHaveBeenLastCalledWith(
      "/explore?region=11&sort=created",
      { scroll: false },
    );
  });
});
