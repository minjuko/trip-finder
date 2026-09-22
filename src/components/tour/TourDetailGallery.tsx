"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  const galleryImages = [
    { url: primaryImage, alt: `${title} 대표 이미지` },
    ...secondaryImages.map((image, index) => ({
      url: image.url,
      alt: image.alt ?? `${title} 추가 이미지 ${index + 1}`,
    })),
  ].filter((image): image is { url: string; alt: string } => Boolean(image.url));
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const openImage = (index: number) => {
    lastFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelectedImage(index);
  };

  const closeImage = () => {
    setSelectedImage(null);
    window.setTimeout(() => {
      lastFocusedElementRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (selectedImage === null) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeImage();
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  if (!primaryImage) {
    return (
      <div className="flex aspect-[16/7] items-center justify-center rounded-3xl bg-surface-subtle text-sm text-slate-600">
        이미지 정보가 없습니다.
      </div>
    );
  }

  return (
    <section
      aria-label={`${title} 이미지`}
      className="grid gap-3 overflow-hidden rounded-3xl md:grid-cols-[2fr_1fr]"
    >
      <button
        type="button"
        onClick={() => openImage(0)}
        aria-label={`${title} 대표 이미지 크게 보기`}
        className="group relative aspect-[4/3] overflow-hidden bg-slate-100 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset md:aspect-auto md:min-h-[460px]"
      >
        <Image
          src={primaryImage}
          alt={`${title} 대표 이미지`}
          fill
          loading="eager"
          sizes="(min-width: 768px) 66vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-4 right-4 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">크게 보기</span>
      </button>

      {secondaryImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          {secondaryImages
            .slice(0, 2)
            .map((image, index) => (
              <button
                type="button"
                key={image.id}
                onClick={() => openImage(index + 1)}
                aria-label={`${title} 추가 이미지 ${index + 1} 크게 보기`}
                className="group relative aspect-[4/3] overflow-hidden bg-slate-100 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset md:aspect-auto md:min-h-0"
              >
                <Image
                  src={image.url}
                  alt={
                    image.alt ??
                    `${title} 추가 이미지 ${index + 1}`
                  }
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              </button>
            ))}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="hidden bg-slate-100 md:block"
        />
      )}
      {selectedImage !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} 이미지 크게 보기`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-5"
          onClick={closeImage}
        >
          <button
            type="button"
            aria-label="이미지 닫기"
            onClick={closeImage}
            ref={closeButtonRef}
            className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            ×
          </button>
          <Image
            src={galleryImages[selectedImage].url}
            alt={galleryImages[selectedImage].alt}
            width={1600}
            height={1100}
            className="max-h-[85vh] w-auto max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </section>
  );
};
