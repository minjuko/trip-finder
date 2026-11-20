"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  messageForApiError,
  travelListsApi,
  type ItemPage,
  type TravelList,
  type TravelListItem,
} from "@/lib/travel-lists/client";
import { TravelListThumbnail } from "@/components/travel-lists/TravelListThumbnail";

interface Props {
  listId: string;
}

export function TravelListDetail({ listId }: Props) {
  const [list, setList] = useState<TravelList | null>(null);
  const [items, setItems] = useState<TravelListItem[]>([]);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TravelListItem | null>(
    null,
  );
  const titleRef = useRef<HTMLHeadingElement>(null);
  const removeTriggerRef = useRef<HTMLButtonElement | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const current = await travelListsApi.list(listId, signal);
        if (signal?.aborted) return;
        const page: ItemPage = await travelListsApi.items(
          listId,
          undefined,
          signal,
        );
        if (signal?.aborted) return;
        setList({ ...current, version: page.listVersion });
        setItems(page.items);
        setCursor(page.nextCursor);
        setItemCount(page.itemCount);
        setError("");
      } catch (cause) {
        if (signal?.aborted) return;
        setError(messageForApiError(cause));
        if (
          cause instanceof Error &&
          "status" in cause &&
          [401, 403, 404, 503].includes(Number(cause.status))
        ) {
          setList(null);
          setItems([]);
          setItemCount(null);
          setCursor(null);
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [listId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);

  const refreshAfterConflict = async () => {
    await load();
    setNotice("최신 내용을 불러왔습니다. 확인한 뒤 다시 시도해 주세요.");
  };

  const loadMore = async () => {
    if (!cursor || busy) return;
    setBusy(true);
    setError("");
    try {
      const page = await travelListsApi.items(listId, cursor);
      setItems((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
      setItemCount(page.itemCount);
      setList((current) =>
        current ? { ...current, version: page.listVersion } : current,
      );
    } catch (cause) {
      setError(messageForApiError(cause));
      if (
        cause instanceof Error &&
        "code" in cause &&
        cause.code === "CURSOR_STALE"
      )
        await refreshAfterConflict();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete || !list || busy) return;
    setBusy(true);
    setError("");
    try {
      await travelListsApi.deleteItem(
        listId,
        pendingDelete.contentId,
        list.version,
      );
      setPendingDelete(null);
      setNotice("여행지를 목록에서 제거했습니다.");
      await load();
      window.setTimeout(() => titleRef.current?.focus(), 0);
    } catch (cause) {
      setError(messageForApiError(cause));
      if (
        cause instanceof Error &&
        "status" in cause &&
        [409, 412].includes(Number(cause.status))
      ) {
        setPendingDelete(null);
        await refreshAfterConflict();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="list-detail-title">
      <nav aria-label="현재 위치" className="mb-6 text-sm text-slate-500">
        <Link
          className="min-h-11 inline-flex items-center hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          href="/travel-lists"
        >
          내 여행 목록
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>목록 상세</span>
      </nav>
      {loading && !list ? (
        <p
          aria-live="polite"
          className="rounded-2xl bg-white p-6 text-slate-600"
        >
          목록을 불러오고 있습니다…
        </p>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              void load();
            }}
            className="mt-3 min-h-11 rounded-lg bg-white px-3 font-semibold text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            다시 불러오기
          </button>
        </div>
      ) : null}
      <div
        role="status"
        aria-live="polite"
        className="mb-4 text-sm font-semibold text-emerald-800"
      >
        {notice}
      </div>
      {list ? (
        <>
          <header className="mb-7 rounded-3xl border border-line bg-white p-5 sm:p-8">
            <p className="tripfinder-wordmark text-brand">
              ACCOUNT TRAVEL LIST
            </p>
            <h1
              ref={titleRef}
              tabIndex={-1}
              id="list-detail-title"
              className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-4xl"
            >
              {list.name}
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              저장된 장소 {itemCount ?? "—"}개{" "}
              <span className="sr-only">현재 버전 {list.version}</span>
            </p>
          </header>
          {loading ? (
            <p aria-live="polite" className="mb-4 text-sm text-slate-600">
              최신 목록을 확인하고 있습니다…
            </p>
          ) : null}
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface-subtle p-8 text-center">
              <h2 className="font-semibold text-slate-900">
                아직 저장한 여행지가 없습니다.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                여행지 상세에서 이 목록에 장소를 추가할 수 있습니다.
              </p>
              <Link
                href="/explore"
                className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                여행지 탐색하기
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
                >
                  <Link
                    href={`/places/${encodeURIComponent(item.contentId)}`}
                    className="flex min-w-0 flex-1 flex-col sm:flex-row focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <TravelListThumbnail
                      src={item.thumbnailUrl}
                      title={item.title}
                    />
                    <span className="min-w-0 p-4">
                      <span className="block break-words font-bold text-slate-950">
                        {item.title}
                      </span>
                      {item.address ? (
                        <span className="mt-2 block break-words text-sm text-slate-600">
                          {item.address}
                        </span>
                      ) : null}
                      <span className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand">
                        여행지 상세 보기 →
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={(event) => {
                      removeTriggerRef.current = event.currentTarget;
                      setPendingDelete(item);
                    }}
                    className="m-3 min-h-11 shrink-0 self-start rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    제거
                  </button>
                </li>
              ))}
            </ul>
          )}
          {cursor ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={busy}
              className="mt-5 min-h-11 rounded-xl border border-line bg-white px-4 font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {busy ? "불러오는 중…" : "장소 더 불러오기"}
            </button>
          ) : null}
        </>
      ) : null}
      {pendingDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-item-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setPendingDelete(null);
                window.setTimeout(() => removeTriggerRef.current?.focus(), 0);
              }
              if (event.key === "Tab") {
                const focusable =
                  event.currentTarget.querySelectorAll<HTMLElement>(
                    "button:not([disabled])",
                  );
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }
            }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="remove-item-title" className="text-xl font-bold">
              여행지를 제거할까요?
            </h2>
            <p className="mt-3 text-slate-600">
              “{pendingDelete.title}”을(를) 이 목록에서 제거합니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                autoFocus
                type="button"
                onClick={() => {
                  setPendingDelete(null);
                  window.setTimeout(() => removeTriggerRef.current?.focus(), 0);
                }}
                className="min-h-11 rounded-xl border border-line px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="min-h-11 rounded-xl bg-rose-700 px-4 font-semibold text-white disabled:opacity-60"
              >
                {busy ? "제거 중…" : "제거"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
