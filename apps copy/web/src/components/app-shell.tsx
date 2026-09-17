"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { ProjectsIcon, SettingsIcon, SunIcon } from "./icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const { user, logout } = useAuth(); const [theme, setTheme] = useState<"dark" | "light">("dark");
  const canvasMode = pathname.includes("/canvas/");
  useEffect(() => {
    const stored = localStorage.getItem("syncforge-theme") as "dark" | "light" | null;
    const next = stored ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(next); document.documentElement.dataset.theme = next;
  }, []);
  function toggleTheme() { const next = theme === "dark" ? "light" : "dark"; setTheme(next); document.documentElement.dataset.theme = next; localStorage.setItem("syncforge-theme", next); }
  if (canvasMode) return <>{children}</>;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="sidebar-brand" href="/"><span className="brand-glyph"><i /><i /><i /></span><span>SyncForge</span></Link>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          <Link className="nav-item" data-active={pathname === "/" || pathname.startsWith("/projects") ? "true" : "false"} href="/"><ProjectsIcon/><span>Projects</span></Link>
          <Link className="nav-item" data-active={pathname.startsWith("/settings") ? "true" : "false"} href="/settings"><SettingsIcon/><span>Settings</span></Link>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={toggleTheme}><SunIcon/><span>{theme === "dark" ? "Light mode" : "Dark mode"}</span></button>
          <button className="account-chip" onClick={() => void logout()} title="Sign out"><span>{user?.email.slice(0, 2).toUpperCase()}</span><div><b>{user?.email.split("@")[0]}</b><small>Sign out</small></div></button>
        </div>
      </aside>
      <main className="main-surface">{children}</main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link data-active={pathname === "/" || pathname.startsWith("/projects") ? "true" : "false"} href="/"><ProjectsIcon/><span>Projects</span></Link>
        <Link data-active={pathname.startsWith("/settings") ? "true" : "false"} href="/settings"><SettingsIcon/><span>Settings</span></Link>
      </nav>
    </div>
  );
}
