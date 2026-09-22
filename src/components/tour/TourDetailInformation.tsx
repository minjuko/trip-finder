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
        <h2
          id="tour-information-title"
          className="text-2xl font-bold tracking-tight text-slate-950"
        >
          이용 정보
        </h2>
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
