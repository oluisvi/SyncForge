"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { FolderIcon, SettingsIcon } from "./icons";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

type NavigationItem = Readonly<{
  href: "/" | "/settings";
  icon: typeof FolderIcon;
  label: string;
  matches: (pathname: string) => boolean;
}>;

const navigationItems: readonly NavigationItem[] = [
  {
    href: "/",
    icon: FolderIcon,
    label: "Projects",
    matches: (pathname) => pathname === "/" || pathname.startsWith("/projects"),
  },
  {
    href: "/settings",
    icon: SettingsIcon,
    label: "Settings",
    matches: (pathname) => pathname.startsWith("/settings"),
  },
];

function Navigation({
  placement,
}: Readonly<{ placement: "sidebar" | "bottom" }>) {
  const pathname = usePathname();

  return (
    <nav
      className={placement === "sidebar" ? "sidebar-nav" : "bottom-nav"}
      aria-label={
        placement === "sidebar" ? "Primary navigation" : "Mobile navigation"
      }
    >
      {navigationItems.map((item) => {
        const isActive = item.matches(pathname);
        const Icon = item.icon;

        return (
          <Link
            aria-current={
              pathname === item.href
                ? "page"
                : isActive
                  ? "location"
                  : undefined
            }
            className="nav-link"
            data-active={isActive ? "true" : "false"}
            href={item.href}
            key={item.href}
          >
            <Icon />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="SyncForge home">
          SyncForge
        </Link>
        <div className="workspace-context" aria-label="Current context">
          <span>Workspace</span>
        </div>
        <span className="avatar" aria-hidden="true">
          AK
        </span>
        <span className="visually-hidden">Signed in as AK</span>
      </header>

      <aside className="sidebar">
        <Navigation placement="sidebar" />
      </aside>

      <main className="main-surface" id="main-content">
        {children}
      </main>

      <Navigation placement="bottom" />
    </div>
  );
}
