import { z } from "zod";

// 변경: localStorage는 신뢰할 수 없는 외부 입력으로 보고
// Bookmark Domain 구조를 runtime에서 검증
export const bookmarkSchema = z.object({
  contentId: z.string().min(1),
  contentTypeId: z.string().min(1),
  title: z.string().min(1),
  address: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  savedAt: z.string().min(1),
});

export const bookmarksSchema = z.array(bookmarkSchema);
