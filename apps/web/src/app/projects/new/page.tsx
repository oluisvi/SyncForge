import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create project",
};

export default function NewProjectPage() {
  return (
    <section className="content-page" aria-labelledby="new-project-title">
      <div className="content-page__header">
        <p className="eyebrow">Projects</p>
        <h1 id="new-project-title">Create project</h1>
        <p className="content-page__description">
          Project creation will be enabled in a later product task. The web foundation is ready for that flow.
        </p>
      </div>
      <Link className="button button--secondary" href="/">
        Back to workspace
      </Link>
    </section>
  );
}
