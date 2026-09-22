import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "arrow-right" | "bookmark" | "check" | "compass" | "copy"
  | "external-link" | "grid" | "landmark" | "list" | "map"
  | "map-pin" | "mountain" | "share" | "sparkles" | "utensils" | "waves";

interface IconProps extends SVGProps<SVGSVGElement> { name: IconName; size?: number; }

export const Icon = ({ name, size = 20, ...props }: IconProps) => {
  const paths: Record<IconName, ReactNode> = {
    "arrow-right": <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    bookmark: <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.5L6 21V4.75Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    "external-link": <><path d="M14 5h5v5" /><path d="M10 14 19 5" /><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    landmark: <><path d="m3 9 9-5 9 5" /><path d="M5 10h14" /><path d="M7 10v7M12 10v7M17 10v7" /><path d="M4 20h16" /></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    map: <><path d="m3 6 5-2 8 2 5-2v14l-5 2-8-2-5 2V6Z" /><path d="M8 4v14M16 6v14" /></>,
    "map-pin": <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    mountain: <><path d="m3 19 6.5-11 3.2 5 2.1-3L21 19H3Z" /><path d="m7.8 11 1.7 2 1.4-2" /></>,
    share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" /></>,
    sparkles: <><path d="m12 3 1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3Z" /><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 13l.7 1.8 1.8.7-1.8.7L19 18l-.7-1.8-1.8-.7 1.8-.7L19 13Z" /></>,
    utensils: <><path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11" /><path d="M16 3v18M16 3c3 2 4 5 4 8h-4" /></>,
    waves: <><path d="M3 7c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 2 2" /><path d="M3 13c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 2 2" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
};