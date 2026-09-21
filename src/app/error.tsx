"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-6 py-16 text-center">
      <div>
        <p className="text-sm font-semibold text-brand">ERROR</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          정보를 불러오지 못했습니다.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-600">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
