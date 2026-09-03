import Link from "next/link";

import { EmptyArchitectureIcon, PlusIcon } from "@/components/icons";

export default function ArchitectureWorkspacePage() {
  return (
    <section className="workspace-page" aria-labelledby="workspace-title">
      <h1 id="workspace-title">Architecture workspace</h1>

      <div className="empty-state">
        <EmptyArchitectureIcon />
        <div className="empty-state__copy">
          <h2>No architecture selected</h2>
          <p>
            Choose or create a project to begin mapping how your software works.
          </p>
        </div>
        <Link className="button button--primary" href="/projects/new">
          <PlusIcon />
          Create project
        </Link>
      </div>
    </section>
  );
}
