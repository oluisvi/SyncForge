import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <section className="content-page" aria-labelledby="settings-title">
      <div className="content-page__header">
        <p className="eyebrow">Workspace</p>
        <h1 id="settings-title">Settings</h1>
        <p className="content-page__description">
          Workspace preferences will appear here when their product requirements
          are defined.
        </p>
      </div>
    </section>
  );
}
