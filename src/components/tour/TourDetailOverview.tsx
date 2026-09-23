interface TourDetailOverviewProps {
  overview: string | null;
}

export const TourDetailOverview = ({ overview }: TourDetailOverviewProps) => {
  if (!overview) {
    return null;
  }

  return (
    <section
      aria-labelledby="tour-overview-title"
      className="border-t border-slate-200 pt-10"
    >
      <h2
        id="tour-overview-title"
        className="text-2xl font-bold tracking-tight text-slate-950"
      >
        소개
      </h2>

      {/* 변경: TourAPI overview를 HTML로 해석하지 않고 일반 텍스트로 안전하게 렌더링 */}
      <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-700">
        {overview}
      </p>
    </section>
  );
};
