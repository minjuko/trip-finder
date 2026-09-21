import Image from "next/image";

import type {
  TourContentDetail,
  TourImage,
} from "@/types/tour";

interface TourDetailGalleryProps {
  title: string;
  thumbnail: TourContentDetail["thumbnail"];
  images: TourImage[];
}

export const TourDetailGallery = ({
  title,
  thumbnail,
  images,
}: TourDetailGalleryProps) => {
  // 변경: detailImage2가 비어 있어도
  // detailCommon2의 대표 이미지를 gallery fallback으로 사용
  const primaryImage =
    images[0]?.url ??
    thumbnail?.url ??
    null;

  const secondaryImages =
    images.slice(1, 5);

  if (!primaryImage) {
    return (
      <div className="flex aspect-[16/7] items-center justify-center rounded-3xl bg-slate-100 text-sm text-slate-400">
        이미지 정보가 없습니다.
      </div>
    );
  }

  return (
    <section
      aria-label={`${title} 이미지`}
      className="grid gap-3 overflow-hidden rounded-3xl md:grid-cols-[2fr_1fr]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 md:aspect-auto md:min-h-[460px]">
        <Image
          src={primaryImage}
          alt={`${title} 대표 이미지`}
          fill
          priority
          sizes="(min-width: 768px) 66vw, 100vw"
          className="object-cover"
        />
      </div>

      {secondaryImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          {secondaryImages
            .slice(0, 2)
            .map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-[4/3] overflow-hidden bg-slate-100 md:aspect-auto md:min-h-0"
              >
                <Image
                  src={image.url}
                  alt={
                    image.alt ??
                    `${title} 추가 이미지 ${index + 1}`
                  }
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="hidden bg-slate-100 md:block"
        />
      )}
    </section>
  );
};