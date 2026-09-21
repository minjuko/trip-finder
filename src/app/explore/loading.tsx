const CardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
    <div className="aspect-[4/3] animate-pulse bg-slate-200" />
    <div className="space-y-3 p-5">
      <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
      <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
    </div>
  </div>
);

export default function ExploreLoading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8"
      aria-busy="true"
      aria-label="여행지 검색 결과를 불러오는 중"
    >
      <div className="mb-8 space-y-3">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      <div className="mb-8 h-16 max-w-3xl animate-pulse rounded-2xl bg-slate-100" />

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="hidden h-96 animate-pulse rounded-2xl bg-slate-100 lg:block" />
        <div className="grid grid-cols-1 gap-x-5 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
