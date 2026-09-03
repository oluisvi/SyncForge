import type { ReactNode } from "react";

type IconProps = Readonly<{
  className?: string;
}>;

function IconBase({ children, className }: IconProps & Readonly<{ children: ReactNode }>) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "icon"}
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.75 7.5h16.5v10.25a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2V7.5Z" />
      <path d="M3.75 7.5V6.25a2 2 0 0 1 2-2h3.1l1.9 2h7.5a2 2 0 0 1 2 2" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.46 5.46l1.42 1.42M17.12 17.12l1.42 1.42M18.54 5.46l-1.42 1.42M6.88 17.12l-1.42 1.42" />
      <circle cx="12" cy="12" r="6.25" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m8 10 4 4 4-4" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function EmptyArchitectureIcon() {
  return (
    <div className="empty-icon" aria-hidden="true">
      <svg fill="none" focusable="false" viewBox="0 0 72 72">
        <path className="empty-icon__grid" d="M12 24h48M12 48h48M24 12v48M48 12v48" />
        <path className="empty-icon__mark" d="M36 21v30M21 36h30" />
        <circle className="empty-icon__node" cx="36" cy="36" r="3" />
      </svg>
    </div>
  );
}
