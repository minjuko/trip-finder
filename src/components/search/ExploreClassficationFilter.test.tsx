import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ExploreClassificationFilter } from "./ExploreClassificationFilter";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

const depth1Options = [
  {
    code: "NA",
    name: "자연관광",
  },
  {
    code: "VE",
    name: "문화관광",
  },
];

describe("ExploreClassificationFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.history.replaceState(
      {},
      "",
      "/explore",
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );
  });

  it("renders depth1 options", () => {
    render(
      <ExploreClassificationFilter
        depth1Options={depth1Options}
        initialDepth1={null}
        initialDepth2={null}
        initialDepth3={null}
      />,
    );

    expect(
      screen.getByRole("option", {
        name: "자연관광",
      }),
    ).toBeInTheDocument();
  });

  // 변경: 대분류 변경 시 하위 분류와 page 제거
  it("resets dependent parameters when depth1 changes", () => {
    window.history.replaceState(
      {},
      "",
      "/explore?region=11&category1=NA&category2=NA02&category3=NA020900&page=3",
    );

    render(
      <ExploreClassificationFilter
        depth1Options={depth1Options}
        initialDepth1="NA"
        initialDepth2="NA02"
        initialDepth3="NA020900"
      />,
    );

    fireEvent.change(
      screen.getByLabelText("대분류"),
      {
        target: {
          value: "VE",
        },
      },
    );

    const destination =
      push.mock.calls[0][0] as string;

    const url = new URL(
      destination,
      "http://localhost",
    );

    expect(
      url.searchParams.get("category1"),
    ).toBe("VE");

    expect(
      url.searchParams.has("category2"),
    ).toBe(false);

    expect(
      url.searchParams.has("category3"),
    ).toBe(false);

    expect(
      url.searchParams.has("page"),
    ).toBe(false);

    // 변경: unrelated filter 보존
    expect(
      url.searchParams.get("region"),
    ).toBe("11");
  });

  it("loads depth2 options from the selected depth1", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          code: "NA02",
          name: "자연경관(하천‧해양)",
        },
      ],
    } as Response);

    render(
      <ExploreClassificationFilter
        depth1Options={depth1Options}
        initialDepth1="NA"
        initialDepth2={null}
        initialDepth3={null}
      />,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/classifications?depth1=NA",
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    expect(
      await screen.findByRole("option", {
        name: "자연경관(하천‧해양)",
      }),
    ).toBeInTheDocument();
  });

  // 변경: 중분류 변경 시 category3/page만 제거
  it("preserves depth1 when depth2 changes", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          code: "NA02",
          name: "자연경관(하천‧해양)",
        },
      ],
    } as Response);

    window.history.replaceState(
      {},
      "",
      "/explore?category1=NA&category3=NA020900&page=2&keyword=%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5",
    );

    render(
      <ExploreClassificationFilter
        depth1Options={depth1Options}
        initialDepth1="NA"
        initialDepth2={null}
        initialDepth3={null}
      />,
    );

    const depth2Select =
      screen.getByLabelText("중분류");

    await waitFor(() => {
      expect(depth2Select).not.toBeDisabled();
    });

    fireEvent.change(depth2Select, {
      target: {
        value: "NA02",
      },
    });

    const destination =
      push.mock.calls[0][0] as string;

    const url = new URL(
      destination,
      "http://localhost",
    );

    expect(
      url.searchParams.get("category1"),
    ).toBe("NA");

    expect(
      url.searchParams.get("category2"),
    ).toBe("NA02");

    expect(
      url.searchParams.has("category3"),
    ).toBe(false);

    expect(
      url.searchParams.has("page"),
    ).toBe(false);

    expect(
      url.searchParams.get("keyword"),
    ).toBe("해수욕장");
  });

  // 변경: 기존 1·2단계가 있으면 2단계와 3단계를 각각 조회
  it("loads depth2 and depth3 options for existing hierarchy", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            code: "NA02",
            name: "자연경관(하천‧해양)",
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            code: "NA020900",
            name: "해변. 해수욕장",
          },
        ],
      } as Response);

    render(
      <ExploreClassificationFilter
        depth1Options={depth1Options}
        initialDepth1="NA"
        initialDepth2="NA02"
        initialDepth3="NA020900"
      />,
    );

    expect(
      await screen.findByRole("option", {
        name: "해변. 해수욕장",
      }),
    ).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      "/api/classifications?depth1=NA&depth2=NA02",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("updates depth3 and resets only the page", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            code: "NA02",
            name: "자연경관(하천‧해양)",
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            code: "NA020900",
            name: "해변. 해수욕장",
          },
        ],
      } as Response);

    window.history.replaceState(
      {},
      "",
      "/explore?region=11&category1=NA&category2=NA02&page=4",
    );

    render(
      <ExploreClassificationFilter
        depth1Options={depth1Options}
        initialDepth1="NA"
        initialDepth2="NA02"
        initialDepth3={null}
      />,
    );

    const depth3Select =
      screen.getByLabelText("소분류");

    await waitFor(() => {
      expect(depth3Select).not.toBeDisabled();
    });

    fireEvent.change(depth3Select, {
      target: {
        value: "NA020900",
      },
    });

    const destination =
      push.mock.calls[0][0] as string;

    const url = new URL(
      destination,
      "http://localhost",
    );

    expect(
      url.searchParams.get("category1"),
    ).toBe("NA");

    expect(
      url.searchParams.get("category2"),
    ).toBe("NA02");

    expect(
      url.searchParams.get("category3"),
    ).toBe("NA020900");

    expect(
      url.searchParams.get("region"),
    ).toBe("11");

    expect(
      url.searchParams.has("page"),
    ).toBe(false);
  });
});