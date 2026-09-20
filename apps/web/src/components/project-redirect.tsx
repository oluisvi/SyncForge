"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
export function ProjectRedirect({ projectId }: { projectId: string }) {
  const router = useRouter();
  useEffect(() => {
    api<Project>(`/projects/${projectId}`)
      .then((p) => {
        const canvas = p.canvases[0];
        router.replace(canvas ? `/projects/${p.id}/canvas/${canvas.id}` : "/");
      })
      .catch(() => router.replace("/"));
  }, [projectId, router]);
  return (
    <div className="workspace-loading">
      <div className="loader-orbit" />
      <p>Opening architecture…</p>
    </div>
  );
}
