"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { OrganizationMembership, Project } from "@/lib/types";
import { GitIcon } from "./icons";

export function NewProjectForm() {
  const router = useRouter(); const [orgs, setOrgs] = useState<OrganizationMembership[]>([]); const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [repositoryUrl, setRepositoryUrl] = useState(""); const [branch, setBranch] = useState("main"); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { void api<OrganizationMembership[]>("/organizations").then((items) => { setOrgs(items); setOrganizationId(items[0]?.organization.id ?? ""); }).catch(() => undefined); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!organizationId) return; setBusy(true); setError("");
    try {
      const project = await api<Project>(`/organizations/${organizationId}/projects`, { method: "POST", body: JSON.stringify({ name, description: description || undefined, repositoryUrl: repositoryUrl || undefined, branch }) });
      const canvas = project.canvases[0]; router.push(canvas ? `/projects/${project.id}/canvas/${canvas.id}` : "/");
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Could not create project"); } finally { setBusy(false); }
  }
  return <div className="form-page"><header><span className="eyebrow">New architecture</span><h1>Create a project</h1><p>Start manually, or connect GitHub now and generate a first architecture after creation.</p></header><form className="project-form" onSubmit={submit}>
    <div className="form-section"><h2>Project</h2><div className="form-grid"><label>Workspace<select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required>{orgs.map((m) => <option key={m.organization.id} value={m.organization.id}>{m.organization.name}</option>)}</select></label><label>Project name<input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="FlowDesk" autoFocus /></label><label className="span-2">Description<textarea maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What system or architectural question does this project document?" /></label></div></div>
    <div className="form-section"><div className="form-section-title"><GitIcon/><div><h2>Repository</h2><p>Optional. SyncForge reads source as untrusted text and never executes it.</p></div></div><div className="form-grid"><label className="span-2">GitHub URL<input type="url" value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} placeholder="https://github.com/owner/repository" /></label><label>Branch<input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" /></label></div></div>
    {error && <div className="form-error">{error}</div>}<div className="form-actions"><button className="text-button" type="button" onClick={() => router.back()}>Cancel</button><button className="primary-button" disabled={busy || !organizationId}>{busy ? "Creating…" : "Create project"}</button></div>
  </form></div>;
}
