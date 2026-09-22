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
      <div className="max-w-2xl">
        <p className="mb-2 text-xs font-semibold tracking-wider text-brand">
          INFORMATION
        </p>
        <h2
          id="tour-information-title"
          className="text-2xl font-bold tracking-tight text-slate-950"
        >
          이용 정보
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          방문 전에 필요한 주요 이용 정보를 확인하세요.
        </p>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {information.map(({ key, label, value }) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-200 bg-surface-subtle p-5"
          >
            <dt className="text-xs font-semibold text-slate-600">
              {label}
            </dt>
            <dd className="mt-2 min-w-0 whitespace-pre-line break-words text-sm font-medium leading-6 text-slate-900">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
