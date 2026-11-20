export interface TravelList {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TravelListItem {
  id: string;
  contentId: string;
  contentTypeId: string;
  title: string;
  address: string | null;
  thumbnailUrl: string | null;
  position: number;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ItemPage extends Page<TravelListItem> {
  listVersion: number;
  itemCount: number;
}

export class TravelListApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "TravelListApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => null)) as
    { error?: { code?: string; message?: string } } | T | null;
  if (!response.ok) {
    const error =
      body && typeof body === "object" && "error" in body
        ? body.error
        : undefined;
    throw new TravelListApiError(
      response.status,
      error?.code ?? "REQUEST_FAILED",
      error?.message ?? "요청을 처리하지 못했습니다.",
    );
  }
  return body as T;
}

const json = (value: unknown) => ({
  method: "POST",
  body: JSON.stringify(value),
});

export const travelListsApi = {
  lists(cursor?: string, signal?: AbortSignal) {
    const query = new URLSearchParams({ limit: "50" });
    if (cursor) query.set("cursor", cursor);
    return request<Page<TravelList>>(`/api/travel-lists?${query}`, { signal });
  },
  create(name: string) {
    return request<TravelList>("/api/travel-lists", json({ name }));
  },
  list(id: string, signal?: AbortSignal) {
    return request<TravelList>(`/api/travel-lists/${encodeURIComponent(id)}`, {
      signal,
    });
  },
  rename(id: string, name: string, expectedVersion: number) {
    return request<TravelList>(`/api/travel-lists/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ name, expectedVersion }),
    });
  },
  deleteList(id: string) {
    return request<void>(`/api/travel-lists/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  items(id: string, cursor?: string, signal?: AbortSignal) {
    const query = new URLSearchParams({ limit: "20" });
    if (cursor) query.set("cursor", cursor);
    return request<ItemPage>(
      `/api/travel-lists/${encodeURIComponent(id)}/items?${query}`,
      { signal },
    );
  },
  addItem(
    listId: string,
    contentId: string,
    contentTypeId: string,
    expectedVersion: number,
  ) {
    return request<{ item: TravelListItem; listVersion: number }>(
      `/api/travel-lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(contentId)}`,
      {
        method: "PUT",
        body: JSON.stringify({ contentTypeId, expectedVersion }),
      },
    );
  },
  deleteItem(listId: string, contentId: string, expectedVersion: number) {
    return request<void>(
      `/api/travel-lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(contentId)}`,
      {
        method: "DELETE",
        headers: { "If-Match": `"list-v${expectedVersion}"` },
      },
    );
  },
};

export function messageForApiError(error: unknown): string {
  if (!(error instanceof TravelListApiError)) {
    return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  }
  if (error.status === 503 && error.code === "AUTH_DISABLED") {
    return "계정 여행 목록은 현재 비활성 상태입니다. 서버 인증 설정이 완료되면 사용할 수 있습니다.";
  }
  if (error.status === 401) {
    return "로그인이 필요합니다. 현재 Google 로그인을 아직 사용할 수 없습니다.";
  }
  if (error.status === 403)
    return "요청 출처를 확인할 수 없어 변경을 거부했습니다.";
  if (error.status === 404)
    return "목록을 찾을 수 없습니다. 목록 화면에서 다시 확인해 주세요.";
  if (error.status === 409 || error.status === 412) {
    if (error.code === "CURSOR_STALE") {
      return "목록이 변경되어 페이지 위치가 만료되었습니다. 최신 목록을 다시 불러옵니다.";
    }
    if (error.code === "CONTENT_ID_CONFLICT") {
      return "이 장소 ID가 다른 유형으로 이미 저장되어 있어 추가할 수 없습니다.";
    }
    return "다른 변경이 먼저 저장되었습니다. 최신 내용을 다시 불러왔습니다. 확인 후 다시 시도해 주세요.";
  }
  if (error.code === "CONTENT_NOT_FOUND") {
    return "TourAPI에서 해당 여행지를 찾을 수 없습니다.";
  }
  if (error.status === 428)
    return "최신 버전 정보가 필요합니다. 내용을 다시 불러와 주세요.";
  if (error.status === 504)
    return "여행지 정보를 확인하는 데 시간이 오래 걸렸습니다. 잠시 후 다시 시도해 주세요.";
  if (error.status === 503)
    return "여행지 정보를 잠시 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  return "요청을 완료하지 못했습니다. 다시 시도해 주세요.";
}
