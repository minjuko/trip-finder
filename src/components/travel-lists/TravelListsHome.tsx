"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";

import {
  messageForApiError,
  travelListsApi,
  type TravelList,
} from "@/lib/travel-lists/client";

type AccessState = "loading" | "ready" | "disabled" | "signed-out" | "error";

export function TravelListsHome() {
  const [state, setState] = useState<AccessState>("loading");
  const [lists, setLists] = useState<TravelList[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<TravelList | null>(null);
  const [removing, setRemoving] = useState<TravelList | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const page = await travelListsApi.lists(undefined, signal);
      if (signal?.aborted) return;
      setLists(page.items);
      setCursor(page.nextCursor);
      setError("");
      setState("ready");
    } catch (cause) {
      if (signal?.aborted) return;
      setState(
        cause instanceof Error && "status" in cause && cause.status === 503
          ? "disabled"
          : cause instanceof Error && "status" in cause && cause.status === 401
            ? "signed-out"
            : "error",
      );
      setError(messageForApiError(cause));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (editing) nameRef.current?.focus();
    if (removing) cancelRef.current?.focus();
  }, [editing, removing]);

  const rememberFocus = (event: MouseEvent<HTMLElement>) => {
    returnFocusRef.current = event.currentTarget;
  };
  const closeDialog = () => {
    setEditing(null);
    setRemoving(null);
    window.setTimeout(() => {
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
      else listHeadingRef.current?.focus();
    }, 0);
  };
  const onDialogKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") closeDialog();
    if (event.key === "Tab") {
      const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled])",
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
  };

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await travelListsApi.create(name);
      setLists((current) => [created, ...current]);
      setName("");
      setNotice(`“${created.name}” 목록을 만들었습니다.`);
      await load();
    } catch (cause) {
      setError(messageForApiError(cause));
      if (
        cause instanceof Error &&
        "status" in cause &&
        [409, 412].includes(Number(cause.status))
      ) {
        await load();
        setNotice(
          "목록 상태를 새로 확인했습니다. 내용을 확인한 뒤 다시 시도해 주세요.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || busy) return;
    setBusy(true);
    setError("");
    try {
      const updated = await travelListsApi.rename(
        editing.id,
        name,
        editing.version,
      );
      setLists((current) =>
        updated.version === editing.version
          ? current.map((list) => (list.id === updated.id ? updated : list))
          : [updated, ...current.filter((list) => list.id !== updated.id)],
      );
      setNotice(`목록 이름을 “${updated.name}”으로 바꿨습니다.`);
      closeDialog();
      await load();
    } catch (cause) {
      setError(messageForApiError(cause));
      if (
        cause instanceof Error &&
        "status" in cause &&
        [409, 412].includes(Number(cause.status))
      ) {
        closeDialog();
        await load();
        setNotice(
          "다른 변경이 먼저 저장되어 최신 목록을 불러왔습니다. 확인한 뒤 다시 시도해 주세요.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteList = async () => {
    if (!removing || busy) return;
    setBusy(true);
    setError("");
    try {
      await travelListsApi.deleteList(removing.id);
      setLists((current) => current.filter((list) => list.id !== removing.id));
      setNotice(`“${removing.name}” 목록을 삭제했습니다.`);
      closeDialog();
      await load();
    } catch (cause) {
      setError(messageForApiError(cause));
      if (
        cause instanceof Error &&
        "status" in cause &&
        [409, 412].includes(Number(cause.status))
      ) {
        closeDialog();
        await load();
        setNotice("목록을 최신 상태로 확인했습니다. 다시 확인해 주세요.");
      }
    } finally {
      setBusy(false);
    }
  };

  const loadMore = async () => {
    if (!cursor || busy) return;
    setBusy(true);
    setError("");
    try {
      const page = await travelListsApi.lists(cursor);
      setLists((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } catch (cause) {
      setError(messageForApiError(cause));
      if (
        cause instanceof Error &&
        "code" in cause &&
        cause.code === "CURSOR_STALE"
      ) {
        await load();
        setNotice("목록이 변경되어 첫 페이지부터 다시 불러왔습니다.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="travel-lists-title">
      <p className="tripfinder-wordmark mb-3 text-brand">MY TRIPS · ACCOUNT</p>
      <h1
        id="travel-lists-title"
        className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
      >
        내 여행 목록
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
        계정 여행 목록은 이 기기에만 저장되는{" "}
        <Link
          className="font-semibold text-brand underline underline-offset-4"
          href="/bookmarks"
        >
          관심 여행지
        </Link>
        와 별도로 서버에 보관됩니다.
      </p>
      <div
        role="status"
        aria-live="polite"
        className="mt-4 text-sm font-semibold text-emerald-800"
      >
        {notice}
      </div>
      {error && state !== "disabled" && state !== "signed-out" ? (
        <p
          id="travel-list-form-error"
          role="alert"
          className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : null}

      {state === "loading" ? (
        <p
          className="mt-8 rounded-2xl bg-white p-6 text-slate-600"
          aria-live="polite"
        >
          목록을 확인하고 있습니다…
        </p>
      ) : null}
      {state === "disabled" || state === "signed-out" ? (
        <div className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-950">
            {state === "disabled"
              ? "계정 여행 목록을 준비 중입니다"
              : "로그인이 필요합니다"}
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            {error} 실제 Google 로그인은 아직 제공되지 않습니다. 공개 서비스에서
            로그인 가능한 것처럼 표시하지 않으며, 인증이 준비될 때까지 목록 관리
            기능을 사용할 수 없습니다.
          </p>
          <Link
            href="/bookmarks"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-line px-4 font-semibold text-slate-800 hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            관심 여행지 보기
          </Link>
        </div>
      ) : null}
      {state === "error" ? (
        <button
          type="button"
          onClick={() => {
            setState("loading");
            setError("");
            void load();
          }}
          className="mt-4 min-h-11 rounded-xl bg-brand px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          다시 불러오기
        </button>
      ) : null}

      {state === "ready" ? (
        <>
          <form
            onSubmit={create}
            className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-end sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor="new-list-name"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                새 목록 이름
              </label>
              <input
                id="new-list-name"
                aria-describedby={`new-list-name-hint${error ? " travel-list-form-error" : ""}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                required
                minLength={1}
                disabled={busy}
                className="min-h-11 w-full rounded-xl border border-line px-3 text-base text-slate-950 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
                placeholder="예: 제주도 주말 여행"
              />
              <p
                id="new-list-name-hint"
                className="mt-2 text-xs text-slate-500"
              >
                1~80자, 공백만 입력할 수 없습니다.
              </p>
            </div>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="min-h-11 rounded-xl bg-brand px-5 font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "저장 중…" : "목록 만들기"}
            </button>
          </form>
          <div className="mt-8">
            <h2
              ref={listHeadingRef}
              tabIndex={-1}
              className="mb-4 text-xl font-bold text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              저장한 목록
            </h2>
            {lists.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-surface-subtle p-8 text-center">
                <p className="font-semibold text-slate-800">
                  아직 만든 여행 목록이 없습니다.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  위에서 첫 목록을 만들어 보세요.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {lists.map((list) => (
                  <li
                    key={list.id}
                    className="rounded-2xl border border-line bg-white p-5 shadow-sm"
                  >
                    <Link
                      href={`/travel-lists/${list.id}`}
                      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      <h3 className="break-words text-lg font-bold text-slate-950">
                        {list.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        목록 상세에서 실제 저장 장소를 확인하세요.
                      </p>
                    </Link>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(event) => {
                          rememberFocus(event);
                          setEditing(list);
                          setName(list.name);
                        }}
                        className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold text-slate-700 hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
                      >
                        이름 변경
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(event) => {
                          rememberFocus(event);
                          setRemoving(list);
                        }}
                        className="min-h-11 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-60"
                      >
                        삭제
                      </button>
                    </div>
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
                {busy ? "불러오는 중…" : "목록 더 불러오기"}
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {editing || removing ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="list-dialog-title"
            onKeyDown={onDialogKeyDown}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            {editing ? (
              <form onSubmit={saveName}>
                <h2 id="list-dialog-title" className="text-xl font-bold">
                  목록 이름 변경
                </h2>
                <label
                  htmlFor="edit-list-name"
                  className="mt-5 block text-sm font-semibold"
                >
                  새 목록 이름
                </label>
                <input
                  ref={nameRef}
                  id="edit-list-name"
                  aria-describedby={`edit-list-name-hint${error ? " travel-list-form-error" : ""}`}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  required
                  disabled={busy}
                  className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p
                  id="edit-list-name-hint"
                  className="mt-2 text-xs text-slate-500"
                >
                  1~80자, 공백만 입력할 수 없습니다.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="min-h-11 rounded-xl border border-line px-4 font-semibold"
                  >
                    취소
                  </button>
                  <button
                    disabled={busy || !name.trim()}
                    className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-white disabled:opacity-60"
                  >
                    {busy ? "저장 중…" : "변경 저장"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 id="list-dialog-title" className="text-xl font-bold">
                  목록을 삭제할까요?
                </h2>
                <p className="mt-3 leading-6 text-slate-600">
                  “{removing?.name}”과 저장된 장소가 함께 삭제됩니다. 이 작업은
                  되돌릴 수 없습니다.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    ref={cancelRef}
                    type="button"
                    onClick={closeDialog}
                    className="min-h-11 rounded-xl border border-line px-4 font-semibold"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteList()}
                    disabled={busy}
                    className="min-h-11 rounded-xl bg-rose-700 px-4 font-semibold text-white disabled:opacity-60"
                  >
                    {busy ? "삭제 중…" : "목록 삭제"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
