export default function PlaceDetailLoading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8"
      aria-busy="true"
      aria-label="여행지 상세정보를 불러오는 중"
    >
      <div className="mb-8 space-y-4">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-2/3 max-w-xl animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-1/2 max-w-md animate-pulse rounded bg-slate-100" />
      </div>

      <div className="aspect-[16/7] animate-pulse rounded-3xl bg-slate-200" />

      <div className="mx-auto mt-12 max-w-5xl space-y-10">
        <div className="space-y-3">
          <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
