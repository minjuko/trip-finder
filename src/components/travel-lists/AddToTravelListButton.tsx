"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  messageForApiError,
  travelListsApi,
  type TravelList,
} from "@/lib/travel-lists/client";
import type { TourContentDetail } from "@/types/tour";

export function AddToTravelListButton({
  content,
}: {
  content: TourContentDetail;
}) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<TravelList[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const listRequestRef = useRef<AbortController | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (open) (selectRef.current ?? cancelRef.current)?.focus();
  }, [open]);

  useEffect(() => () => listRequestRef.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) close();
      if (event.key === "Tab") {
        const dialog = document.getElementById("add-travel-list-dialog");
        const focusable = dialog?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), select:not([disabled])",
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, close]);

  const openChooser = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    listRequestRef.current?.abort();
    const controller = new AbortController();
    listRequestRef.current = controller;
    try {
      const page = await travelListsApi.lists(undefined, controller.signal);
      if (controller.signal.aborted) return;
      setLists(page.items);
      setCursor(page.nextCursor);
      setSelectedId(page.items[0]?.id ?? "");
      setOpen(true);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(messageForApiError(cause));
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  const loadMoreLists = async () => {
    if (!cursor || busy) return;
    setBusy(true);
    setError("");
    listRequestRef.current?.abort();
    const controller = new AbortController();
    listRequestRef.current = controller;
    try {
      const page = await travelListsApi.lists(cursor, controller.signal);
      if (controller.signal.aborted) return;
      setLists((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(messageForApiError(cause));
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  const save = async () => {
    const selected = lists.find((list) => list.id === selectedId);
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await travelListsApi.addItem(
        selected.id,
        content.id,
        content.contentTypeId,
        selected.version,
      );
      setMessage(
        `“${content.title}”을(를) “${selected.name}”에 저장했습니다. 이미 저장된 장소라면 기존 항목이 유지됩니다.`,
      );
      close();
    } catch (cause) {
      setError(messageForApiError(cause));
      if (
        cause instanceof Error &&
        "status" in cause &&
        [409, 412].includes(Number(cause.status))
      ) {
        try {
          const fresh = await travelListsApi.list(selected.id);
          setLists((current) =>
            current.map((list) => (list.id === fresh.id ? fresh : list)),
          );
          setError(
            "목록이 다른 곳에서 변경되었습니다. 최신 목록 정보를 확인했습니다. 저장을 다시 눌러 주세요.",
          );
        } catch (refreshError) {
          setError(messageForApiError(refreshError));
          close();
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => void openChooser()}
        disabled={busy}
        className="inline-flex min-h-11 w-fit shrink-0 items-center justify-center rounded-xl border border-brand bg-white px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-wait disabled:opacity-60"
      >
        {busy && !open ? "목록 확인 중…" : "여행 목록에 추가"}
      </button>
      {error && !open ? (
        <p role="alert" className="mt-2 max-w-lg text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) close();
          }}
        >
          <section
            id="add-travel-list-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-travel-list-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2
              id="add-travel-list-title"
              className="text-xl font-bold text-slate-950"
            >
              여행 목록에 저장
            </h2>
            <p className="mt-2 break-words text-sm text-slate-600">
              {content.title}
            </p>
            {lists.length === 0 ? (
              <p className="mt-5 rounded-xl bg-surface-subtle p-4 text-sm text-slate-700">
                저장할 여행 목록이 없습니다.{" "}
                <Link
                  href="/travel-lists"
                  className="font-semibold text-brand underline"
                >
                  목록 화면
                </Link>
                에서 먼저 만들어 주세요.
              </p>
            ) : (
              <>
                <label
                  htmlFor="travel-list-choice"
                  className="mt-5 block text-sm font-semibold text-slate-800"
                >
                  저장할 목록
                </label>
                <select
                  ref={selectRef}
                  id="travel-list-choice"
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  disabled={busy}
                  className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
                {cursor ? (
                  <button
                    type="button"
                    onClick={() => void loadMoreLists()}
                    disabled={busy}
                    className="mt-2 min-h-11 text-sm font-semibold text-brand underline underline-offset-4"
                  >
                    다른 목록 더 불러오기
                  </button>
                ) : null}
              </>
            )}
            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"
              >
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={close}
                className="min-h-11 rounded-xl border border-line px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                취소
              </button>
              {lists.length > 0 ? (
                <button
                  ref={cancelRef}
                  type="button"
                  disabled={busy || !selectedId}
                  onClick={() => void save()}
                  className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
                >
                  {busy ? "저장 중…" : "이 목록에 저장"}
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-2 text-sm font-semibold text-emerald-800"
        >
          {message}
        </p>
      ) : null}
    </>
  );
}
