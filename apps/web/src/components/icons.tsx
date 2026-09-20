import type { SVGProps } from "react";
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}
export const ProjectsIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 7.5h6l2 2H20v9.5H4z" />
    <path d="M4 7.5V5h5l2 2.5" />
  </Icon>
);
export const SettingsIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L5.1 11a7 7 0 0 0 0 2L3 14.5l2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 3.1h5l.4-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.5c.1-.3.1-.7.1-1z" />
  </Icon>
);
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="m16 16 4 4" />
  </Icon>
);
export const HistoryIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 12a8 8 0 1 0 2-5.3L4 9" />
    <path d="M4 4v5h5M12 8v5l3 2" />
  </Icon>
);
export const GitIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="6" cy="5" r="2" />
    <circle cx="18" cy="7" r="2" />
    <circle cx="6" cy="19" r="2" />
    <path d="M6 7v10M8 8c4 0 4-1 8-1" />
  </Icon>
);
export const ExportIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3v12M8 7l4-4 4 4M5 13v7h14v-7" />
  </Icon>
);
export const ZoomInIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="10" cy="10" r="6" />
    <path d="M10 7v6M7 10h6M15 15l5 5" />
  </Icon>
);
export const ZoomOutIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="10" cy="10" r="6" />
    <path d="M7 10h6M15 15l5 5" />
  </Icon>
);
export const LinkIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M9 15 7 17a4 4 0 0 1-6-6l3-3a4 4 0 0 1 6 0" />
    <path d="m15 9 2-2a4 4 0 0 1 6 6l-3 3a4 4 0 0 1-6 0" />
    <path d="m8 16 8-8" />
  </Icon>
);
export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
  </Icon>
);
export const CommentIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 5h16v12H9l-5 4z" />
  </Icon>
);
export const SunIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
  </Icon>
);
