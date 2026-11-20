import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getContext: vi.fn(),
  add: vi.fn(),
  getDetail: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => ({
  getTravelListItemContext: mocks.getContext,
  addTravelListItem: mocks.add,
}));
vi.mock("@/lib/tour-api/detail-common", () => ({
  getTourDetailCommon: mocks.getDetail,
}));

import { TourApiError } from "@/lib/tour-api/errors";
import { addVerifiedTravelListItem } from "./service";

const listId = "d7ca2e31-0b61-4c1e-bc89-7a335aee6893";
const id = "127480";
const detail = {
  id,
  contentTypeId: "12",
  title: "가거도",
  address: { primary: "전남 신안군", detail: null, zipCode: null },
  thumbnail: { url: "https://example.test/image.jpg", copyrightType: null },
};

describe("verified travel-list item addition", () => {
  beforeEach(() => {
    mocks.getContext.mockReset();
    mocks.add.mockReset().mockResolvedValue({ status: 201 });
    mocks.getDetail.mockReset().mockResolvedValue(detail);
  });

  it("checks owner-scoped list existence and version before TourAPI", async () => {
    mocks.getContext.mockResolvedValueOnce(null);
    await expect(
      addVerifiedTravelListItem("owner-a", listId, id, "12", 1),
    ).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(mocks.getDetail).not.toHaveBeenCalled();

    mocks.getContext.mockResolvedValueOnce({ listVersion: 4, item: null });
    await expect(
      addVerifiedTravelListItem("owner-a", listId, id, "12", 3),
    ).rejects.toMatchObject({ status: 409, code: "VERSION_CONFLICT" });
    expect(mocks.getDetail).not.toHaveBeenCalled();
  });

  it("rechecks a duplicate under the repository lock with its saved snapshot", async () => {
    const existing = {
      id: "item-1",
      contentId: id,
      contentTypeId: "12",
      title: "Saved title",
      address: "Saved address",
      thumbnailUrl: null,
    };
    mocks.getContext.mockResolvedValueOnce({ listVersion: 4, item: existing });
    mocks.add.mockResolvedValueOnce({ status: 200 });
    await expect(
      addVerifiedTravelListItem("owner-a", listId, id, "12", 1),
    ).resolves.toMatchObject({ status: 200 });
    expect(mocks.getDetail).not.toHaveBeenCalled();
    expect(mocks.add).toHaveBeenCalledWith(
      "owner-a",
      listId,
      id,
      "12",
      1,
      "12",
      {
        title: "Saved title",
        address: "Saved address",
        thumbnailUrl: null,
      },
    );
  });

  it("returns not-found when TourAPI has no canonical content", async () => {
    mocks.getContext.mockResolvedValueOnce({ listVersion: 1, item: null });
    mocks.getDetail.mockResolvedValueOnce(null);
    await expect(
      addVerifiedTravelListItem("owner-a", listId, id, "12", 1),
    ).rejects.toMatchObject({ status: 404, code: "CONTENT_NOT_FOUND" });
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it("maps canonical data to the minimal stored server snapshot", async () => {
    mocks.getContext.mockResolvedValueOnce({ listVersion: 1, item: null });
    await addVerifiedTravelListItem("owner-a", listId, id, "12", 1);
    expect(mocks.add).toHaveBeenCalledWith(
      "owner-a",
      listId,
      id,
      "12",
      1,
      "12",
      {
        title: "가거도",
        address: "전남 신안군",
        thumbnailUrl: "https://example.test/image.jpg",
      },
    );

    mocks.getContext.mockResolvedValueOnce({ listVersion: 1, item: null });
    mocks.getDetail.mockResolvedValueOnce({ ...detail, title: "  " });
    await expect(
      addVerifiedTravelListItem("owner-a", listId, id, "12", 1),
    ).rejects.toMatchObject({
      status: 503,
      code: "CONTENT_SOURCE_UNAVAILABLE",
    });
  });

  it("distinguishes TourAPI timeout from other source errors", async () => {
    mocks.getContext.mockResolvedValue({ listVersion: 1, item: null });
    mocks.getDetail.mockRejectedValueOnce(
      new TourApiError("TIMEOUT", "private timeout detail"),
    );
    await expect(
      addVerifiedTravelListItem("owner-a", listId, id, "12", 1),
    ).rejects.toMatchObject({ status: 504, code: "CONTENT_SOURCE_TIMEOUT" });

    mocks.getDetail.mockRejectedValueOnce(new Error("private upstream detail"));
    await expect(
      addVerifiedTravelListItem("owner-a", listId, id, "12", 1),
    ).rejects.toMatchObject({
      status: 503,
      code: "CONTENT_SOURCE_UNAVAILABLE",
      message: expect.not.stringContaining("private upstream detail"),
    });
  });
});
