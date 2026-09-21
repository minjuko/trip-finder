import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-6 py-16 text-center">
      <div>
        <p className="text-sm font-semibold text-brand">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          페이지를 찾을 수 없습니다.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-600">
          주소가 변경되었거나 존재하지 않는 여행지일 수 있습니다.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            홈으로
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            여행지 탐색
          </Link>
        </div>
      </div>
    </main>
  );
}
