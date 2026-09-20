import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: { default: "SyncForge", template: "%s · SyncForge" },
  description:
    "Collaborative architecture intelligence — see, explore and evolve software systems together.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
