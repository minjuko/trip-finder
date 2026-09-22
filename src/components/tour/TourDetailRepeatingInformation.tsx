import type { RepeatingInfoItem } from "@/types/tour";

interface TourDetailRepeatingInformationProps {
  items: RepeatingInfoItem[];
}

export const TourDetailRepeatingInformation = ({
  items,
}: TourDetailRepeatingInformationProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="tour-repeating-information-title"
      className="border-t border-slate-200 pt-10"
    >
      <div className="max-w-2xl">
        <h2
          id="tour-repeating-information-title"
          className="text-2xl font-bold tracking-tight text-slate-950"
        >
          추가 상세정보
        </h2>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-surface-subtle p-5"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              {item.title}
            </h3>
            {item.description ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
};
