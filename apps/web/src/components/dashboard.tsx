"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { OrganizationMembership, Project } from "@/lib/types";
import { GitIcon, PlusIcon } from "./icons";

function relative(date: string): string {
  const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function Dashboard() {
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orgs, recent] = await Promise.all([
        api<OrganizationMembership[]>("/organizations"),
        api<Project[]>("/projects"),
      ]);
      setMemberships(orgs);
      setProjects(recent);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Could not load workspace",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const activeProjects = useMemo(() => projects.slice(0, 8), [projects]);
  async function createOrg(event: FormEvent) {
    event.preventDefault();
    if (!orgName.trim()) return;
    setCreating(true);
    setError("");
    try {
      await api("/organizations", {
        method: "POST",
        body: JSON.stringify({ name: orgName }),
      });
      setOrgName("");
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not create workspace",
      );
    } finally {
      setCreating(false);
    }
  }
  if (loading)
    return (
      <div className="page-loading">
        <span className="loading-orbit" />
        Loading workspace…
      </div>
    );
  if (memberships.length === 0)
    return (
      <div className="onboarding-page">
        <div className="onboarding-grid" aria-hidden="true" />
        <section className="onboarding-card">
          <span className="eyebrow">First forge</span>
          <h1>Create your workspace</h1>
          <p>
            A workspace keeps architecture projects, teammates, repository
            analysis and history inside one authorization boundary.
          </p>
          <form onSubmit={createOrg}>
            <label>
              Workspace name
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Engineering"
                minLength={2}
                maxLength={120}
                required
                autoFocus
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button" disabled={creating}>
              {creating ? "Creating…" : "Create workspace"}
            </button>
          </form>
        </section>
      </div>
    );
  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Architecture workspace</span>
          <h1>Make the system visible.</h1>
          <p>
            Explore how your software is organized, keep the map alive, and work
            on it together.
          </p>
        </div>
        <Link className="primary-button" href="/projects/new">
          <PlusIcon />
          New project
        </Link>
      </header>
      {error && (
        <div className="inline-error">
          {error}
          <button onClick={() => void load()}>Retry</button>
        </div>
      )}
      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Recent projects</h2>
          <span>{projects.length} active</span>
        </div>
        {activeProjects.length === 0 ? (
          <div className="empty-projects">
            <div className="empty-diagram" aria-hidden="true">
              <i />
              <i />
              <i />
              <span />
              <span />
            </div>
            <h3>Your first architecture starts here</h3>
            <p>
              Create a blank canvas or connect a GitHub repository and let
              SyncForge extract a first map from verified code facts.
            </p>
            <Link className="secondary-button" href="/projects/new">
              Create project
            </Link>
          </div>
        ) : (
          <div className="project-grid">
            {activeProjects.map((project, index) => {
              const canvas = project.canvases[0];
              const href = canvas
                ? `/projects/${project.id}/canvas/${canvas.id}`
                : `/projects/${project.id}`;
              return (
                <Link
                  className="project-card"
                  href={href}
                  key={project.id}
                  style={
                    { "--stagger": `${index * 35}ms` } as React.CSSProperties
                  }
                >
                  <div className="project-visual" aria-hidden="true">
                    <div className="pv-node a" />
                    <div className="pv-node b" />
                    <div className="pv-node c" />
                    <svg viewBox="0 0 200 90">
                      <path d="M38 28 C78 28, 65 60, 101 59" />
                      <path d="M117 59 C150 59, 150 31, 166 31" />
                    </svg>
                  </div>
                  <div className="project-card-body">
                    <div className="project-title-row">
                      <h3>{project.name}</h3>
                      <span className="status-dot" title="Ready" />
                    </div>
                    <p>
                      {project.description ||
                        "Architecture intelligence project"}
                    </p>
                    <div className="project-meta">
                      <span>
                        {project.repositoryUrl ? (
                          <>
                            <GitIcon />
                            Connected
                          </>
                        ) : (
                          "Manual"
                        )}
                      </span>
                      <span>v{canvas?.version ?? 0}</span>
                      <span>{relative(project.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <section className="workspace-strip">
        <div>
          <span className="eyebrow">Workspaces</span>
          <h2>{memberships.map((m) => m.organization.name).join(" · ")}</h2>
        </div>
        <div className="workspace-metrics">
          <div>
            <strong>
              {memberships.reduce(
                (sum, m) => sum + (m.organization._count?.memberships ?? 1),
                0,
              )}
            </strong>
            <span>members</span>
          </div>
          <div>
            <strong>{projects.length}</strong>
            <span>projects</span>
          </div>
          <div>
            <strong>
              {projects.reduce(
                (sum, p) => sum + (p.canvases[0]?.version ?? 0),
                0,
              )}
            </strong>
            <span>architecture changes</span>
          </div>
        </div>
      </section>
    </div>
  );
}
