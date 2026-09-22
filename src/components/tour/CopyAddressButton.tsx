"use client";

import { useState } from "react";\n\nimport { Icon } from "@/components/ui/Icon";

interface CopyAddressButtonProps {
  address: string;
}

export const CopyAddressButton = ({ address }: CopyAddressButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // 브라우저가 클립보드를 지원하지 않는 경우 조용히 원래 상태를 유지한다.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="주소 복사"
      className="ml-2 inline-flex rounded-md px-1.5 py-1 text-xs font-semibold text-brand transition hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <Icon name={copied ? "check" : "copy"} size={14} className="mr-1" />\n      {copied ? "복사됨" : "주소 복사"}
    </button>
  );
};
