import Image from "next/image";

interface TravelListThumbnailProps {
  src: string | null;
  title: string;
}

export function isSupportedTravelListImageUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname === "tong.visitkorea.or.kr" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname.startsWith("/cms/resource/")
    );
  } catch {
    return false;
  }
}

export function TravelListThumbnail({ src, title }: TravelListThumbnailProps) {
  if (src && isSupportedTravelListImageUrl(src)) {
    return (
      <div className="relative aspect-[16/9] w-full shrink-0 bg-surface-subtle sm:aspect-square sm:w-36">
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 640px) 144px, 100vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="grid aspect-[16/9] w-full shrink-0 place-items-center bg-surface-subtle text-sm text-slate-500 sm:aspect-square sm:w-36"
      title={`${title} 이미지 없음`}
    >
      이미지 없음
    </div>
  );
}
