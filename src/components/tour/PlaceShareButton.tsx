"use client";

import { useState } from "react";\n\nimport { Icon } from "@/components/ui/Icon";

interface PlaceShareButtonProps {
  title: string;
}

export const PlaceShareButton = ({
  title,
}: PlaceShareButtonProps) => {
  const [status, setStatus] = useState<"idle" | "copied">("idle");

  const handleShare = async () => {
    const shareData = {
      title: `${title} | TripFinder`,
      text: `${title} 여행 정보를 확인해보세요.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareData.url);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      // 사용자가 공유 창을 닫은 경우에는 오류 메시지를 노출하지 않는다.
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={`${title} 링크 공유`}
      className="inline-flex w-fit shrink-0 items-center justify-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand/30 hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <Icon name="share" size={16} className="mr-2" />
      {status === "copied" ? "링크 복사됨" : "공유"}
    </button>
  );
};
