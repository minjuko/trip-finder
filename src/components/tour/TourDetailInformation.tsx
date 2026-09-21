import type { InformationItem } from "@/types/tour";

interface TourDetailInformationProps {
  information: InformationItem[];
}

export const TourDetailInformation = ({
  information,
}: TourDetailInformationProps) => {
  if (information.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="tour-information-title"
      className="border-t border-slate-200 pt-10"
    >
      <h2
        id="tour-information-title"
        className="text-2xl font-bold tracking-tight text-slate-950"
      >
        이용 정보
      </h2>

      {/* 변경: contentType별 API 필드가 아닌
          공통 InformationItem Domain만 렌더링 */}
      <dl className="mt-6 grid gap-x-8 gap-y-0 sm:grid-cols-2">
        {information.map(
          ({ key, label, value }) => (
            <div
              key={key}
              className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-b border-slate-100 py-4"
            >
              <dt className="text-sm font-medium text-slate-500">
                {label}
              </dt>

              <dd className="min-w-0 whitespace-pre-line break-words text-sm leading-6 text-slate-900">
                {value}
              </dd>
            </div>
          ),
        )}
      </dl>
    </section>
  );
};