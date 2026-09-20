"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, eventSource } from "@/lib/api";
import type {
  ArchitectureNode,
  CanvasState,
  Comment,
  EdgeType,
  NodeType,
  Project,
  RepositoryAnalysis,
  Snapshot,
} from "@/lib/types";
import { mermaid } from "@/lib/canvas-utils";
import {
  CanvasGraph,
  type CanvasGraphHandle,
  type Viewport,
} from "./canvas-graph";

const NODE_TYPES: NodeType[] = [
  "FRONTEND",
  "BACKEND",
  "SERVICE",
  "DATABASE",
  "CACHE",
  "QUEUE",
  "INFRASTRUCTURE",
  "EXTERNAL",
  "GENERIC",
];
const EDGE_TYPES: EdgeType[] = [
  "REST",
  "HTTP",
  "GRAPHQL",
  "WEBSOCKET",
  "GRPC",
  "SQL",
  "EVENT",
  "QUEUE",
  "PUBSUB",
  "WEBHOOK",
  "INTERNAL",
];
const clientId =
  typeof crypto !== "undefined" ? crypto.randomUUID() : `client-${Date.now()}`;
const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

type SearchResults = {
  nodes: Array<{
    id: string;
    label: string;
    type: NodeType;
    technology: string | null;
  }>;
  comments: Array<{ id: string; nodeId: string | null; body: string }>;
  files: Array<{ id: string; path: string; language: string }>;
};
type Operation = {
  opId: string;
  clientId: string;
  type: string;
  payload: Record<string, unknown>;
  version?: number;
};

type Props = { projectId: string; canvasId: string };

export function CanvasWorkspace({ projectId, canvasId }: Props) {
  const graph = useRef<CanvasGraphHandle>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<CanvasState | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [panel, setPanel] = useState<
    "inspector" | "repository" | "history" | null
  >(null);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">(
    "connecting",
  );
  const [queue, setQueue] = useState<Operation[]>([]);
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResults>({
    nodes: [],
    comments: [],
    files: [],
  });
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [p, c, cs] = await Promise.all([
      api<Project>(`/projects/${projectId}`),
      api<CanvasState>(`/canvases/${canvasId}`),
      api<Comment[]>(`/canvases/${canvasId}/comments`),
    ]);
    setProject(p);
    setState(c);
    setComments(cs);
    api<RepositoryAnalysis>(`/projects/${projectId}/repository/analysis`)
      .then(setAnalysis)
      .catch(() => undefined);
  }, [projectId, canvasId]);

  useEffect(() => {
    refresh().catch(() => setNotice("Could not load this architecture."));
  }, [refresh]);

  const applyRemote = useCallback(
    (operation: Operation & { version: number }) => {
      if (operation.clientId === clientId) return;
      setState((current) => {
        if (!current) return current;
        const p = operation.payload;
        let nodes = current.nodes,
          edges = current.edges,
          viewport = current.viewport;
        if (operation.type === "UPSERT_NODE") {
          const existing = nodes.find((n) => n.id === p.id);
          const next = {
            ...(existing ?? {
              canvasId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              width: null,
              height: null,
              metadata: {},
            }),
            ...p,
          } as ArchitectureNode;
          nodes = existing
            ? nodes.map((n) => (n.id === next.id ? next : n))
            : [...nodes, next];
        } else if (
          operation.type === "UPDATE_NODE" ||
          operation.type === "MOVE_NODE"
        )
          nodes = nodes.map((n) =>
            n.id === p.id
              ? { ...n, ...p, updatedAt: new Date().toISOString() }
              : n,
          );
        else if (operation.type === "REMOVE_NODE") {
          nodes = nodes.filter((n) => n.id !== p.id);
          edges = edges.filter(
            (e) => e.sourceNodeId !== p.id && e.targetNodeId !== p.id,
          );
        } else if (operation.type === "UPSERT_EDGE") {
          const edge = p as unknown as CanvasState["edges"][number];
          edges = edges.some((e) => e.id === edge.id)
            ? edges.map((e) => (e.id === edge.id ? { ...e, ...edge } : e))
            : [...edges, edge];
        } else if (operation.type === "REMOVE_EDGE")
          edges = edges.filter((e) => e.id !== p.id);
        else if (operation.type === "SET_VIEWPORT")
          viewport = p as CanvasState["viewport"];
        return {
          ...current,
          nodes,
          edges,
          viewport,
          version: Math.max(current.version, operation.version),
        };
      });
    },
    [canvasId],
  );

  useEffect(() => {
    const stream = eventSource(`/canvases/${canvasId}/events`);
    stream.onopen = () => setStatus("live");
    stream.onerror = () => setStatus("offline");
    stream.addEventListener("operation", (event) =>
      applyRemote(JSON.parse((event as MessageEvent).data)),
    );
    stream.addEventListener("comment", (event) => {
      const item = JSON.parse((event as MessageEvent).data) as Comment;
      setComments((items) =>
        items.some((x) => x.id === item.id) ? items : [...items, item],
      );
    });
    stream.addEventListener("comment-resolved", (event) => {
      const { id } = JSON.parse((event as MessageEvent).data) as { id: string };
      setComments((items) =>
        items.map((x) =>
          x.id === id ? { ...x, resolvedAt: new Date().toISOString() } : x,
        ),
      );
    });
    stream.addEventListener("presence", (event) => {
      const presence = JSON.parse(
        (event as MessageEvent).data,
      ) as CanvasState["presence"];
      setState((c) => (c ? { ...c, presence } : c));
    });
    return () => stream.close();
  }, [canvasId, applyRemote]);

  useEffect(() => {
    const timer = setInterval(
      () =>
        api(`/canvases/${canvasId}/presence`, {
          method: "POST",
          body: JSON.stringify({
            nodeId: selectedId ?? undefined,
            action: selectedId ? "viewing" : "exploring",
          }),
        }).catch(() => undefined),
      15000,
    );
    return () => clearInterval(timer);
  }, [canvasId, selectedId]);

  const sendOperation = useCallback(
    async (type: string, payload: Record<string, unknown>) => {
      const operation: Operation = {
        opId: makeId("op"),
        clientId,
        type,
        payload,
      };
      try {
        const response = await api<{ version: number }>(
          `/canvases/${canvasId}/operations`,
          { method: "POST", body: JSON.stringify(operation) },
        );
        setStatus("live");
        setState((c) =>
          c ? { ...c, version: Math.max(c.version, response.version) } : c,
        );
      } catch {
        setStatus("offline");
        setQueue((q) => [...q, operation]);
      }
    },
    [canvasId],
  );

  useEffect(() => {
    if (status !== "live" || queue.length === 0) return;
    let cancelled = false;
    (async () => {
      const pending = [...queue];
      for (const op of pending) {
        if (cancelled) return;
        try {
          await api(`/canvases/${canvasId}/operations`, {
            method: "POST",
            body: JSON.stringify(op),
          });
          setQueue((q) => q.filter((x) => x.opId !== op.opId));
        } catch {
          return;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, queue, canvasId]);

  const selected = state?.nodes.find((n) => n.id === selectedId) ?? null;
  const viewport: Viewport = state?.viewport ?? { x: 80, y: 80, zoom: 1 };

  function mutateNode(id: string, x: number, y: number, commit: boolean) {
    setState((c) =>
      c
        ? {
            ...c,
            nodes: c.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
          }
        : c,
    );
    if (commit) void sendOperation("MOVE_NODE", { id, x, y });
  }
  function setViewport(next: Viewport, commit: boolean) {
    setState((c) => (c ? { ...c, viewport: next } : c));
    if (commit) void sendOperation("SET_VIEWPORT", next);
  }
  function addNode(type: NodeType = "SERVICE") {
    const id = makeId("node");
    const index = state?.nodes.length ?? 0;
    const payload = {
      id,
      type,
      label:
        type === "SERVICE"
          ? "New service"
          : type.charAt(0) + type.slice(1).toLowerCase(),
      x: 140 + (index % 4) * 285,
      y: 130 + Math.floor(index / 4) * 170,
      metadata: { source: "manual" },
    };
    setState((c) =>
      c
        ? {
            ...c,
            nodes: [
              ...c.nodes,
              {
                ...payload,
                canvasId,
                description: null,
                technology: null,
                width: null,
                height: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }
        : c,
    );
    setSelectedId(id);
    setPanel("inspector");
    void sendOperation("UPSERT_NODE", payload);
  }
  function activateNode(id: string) {
    if (connectSourceId && connectSourceId !== id) {
      const edge = {
        id: makeId("edge"),
        sourceNodeId: connectSourceId,
        targetNodeId: id,
        type: "INTERNAL" as EdgeType,
        label: null,
      };
      setState((c) =>
        c
          ? {
              ...c,
              edges: [
                ...c.edges,
                {
                  ...edge,
                  canvasId,
                  metadata: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
            }
          : c,
      );
      void sendOperation("UPSERT_EDGE", edge);
      setConnectSourceId(null);
    } else {
      setSelectedId(id);
      setPanel("inspector");
    }
  }
  async function saveNode(values: Partial<ArchitectureNode>) {
    if (!selected) return;
    setState((c) =>
      c
        ? {
            ...c,
            nodes: c.nodes.map((n) =>
              n.id === selected.id ? { ...n, ...values } : n,
            ),
          }
        : c,
    );
    await sendOperation("UPDATE_NODE", { id: selected.id, ...values });
  }
  async function removeNode() {
    if (!selected) return;
    const id = selected.id;
    setState((c) =>
      c
        ? {
            ...c,
            nodes: c.nodes.filter((n) => n.id !== id),
            edges: c.edges.filter(
              (e) => e.sourceNodeId !== id && e.targetNodeId !== id,
            ),
          }
        : c,
    );
    setSelectedId(null);
    setPanel(null);
    await sendOperation("REMOVE_NODE", { id });
  }
  async function createEdge(type: EdgeType) {
    if (!selected) return;
    setConnectSourceId(selected.id);
    setNotice(`Select another node to connect via ${type.toLowerCase()}.`);
    window.setTimeout(() => setNotice(null), 2500);
  }
  async function runSearch(q: string) {
    setSearch(q);
    if (q.trim().length < 2) {
      setResults({ nodes: [], comments: [], files: [] });
      return;
    }
    setResults(
      await api(`/canvases/${canvasId}/search?q=${encodeURIComponent(q)}`),
    );
  }
  async function openHistory() {
    setPanel("history");
    setSnapshots(await api(`/canvases/${canvasId}/history`));
  }
  async function createSnapshot() {
    const item = await api<Snapshot>(`/canvases/${canvasId}/history`, {
      method: "POST",
      body: JSON.stringify({ label: `Checkpoint v${state?.version ?? 0}` }),
    });
    setSnapshots((s) => [item, ...s]);
    setNotice("Snapshot created.");
  }
  function exportMermaid() {
    if (!state) return;
    const blob = new Blob(
      [mermaid({ nodes: state.nodes, edges: state.edges })],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.slug ?? "syncforge"}-architecture.mmd`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!state || !project)
    return (
      <div className="workspace-loading">
        <div className="loader-orbit" />
        <p>Synchronizing architecture…</p>
      </div>
    );

  return (
    <div className="canvas-workspace">
      <header className="canvas-topbar">
        <div className="canvas-breadcrumb">
          <Link href="/" aria-label="Back to projects">
            ←
          </Link>
          <div>
            <strong>{project.name}</strong>
            <span>
              {state.name} · v{state.version}
            </span>
          </div>
        </div>
        <div className="presence-strip">
          {state.presence.slice(0, 4).map((p) => (
            <span key={p.userId} title={p.email}>
              {p.email[0]?.toUpperCase()}
            </span>
          ))}
          <small data-status={status}>
            {status === "live"
              ? "Live"
              : status === "offline"
                ? `Offline${queue.length ? ` · ${queue.length} queued` : ""}`
                : "Connecting"}
          </small>
        </div>
        <div className="canvas-actions">
          <button onClick={() => setSearchOpen(true)}>⌘ Search</button>
          <button onClick={() => void openHistory()}>History</button>
          <button className="primary" onClick={() => setPanel("repository")}>
            Repository
          </button>
        </div>
      </header>
      <aside className="canvas-tools" aria-label="Canvas tools">
        <button title="Add component" onClick={() => addNode()}>
          ＋
        </button>
        <button
          title="Connect nodes"
          data-active={connectSourceId ? "true" : "false"}
          onClick={() => {
            if (selectedId) setConnectSourceId(selectedId);
            else setNotice("Select a node first.");
          }}
        >
          ↗
        </button>
        <button title="Fit architecture" onClick={() => graph.current?.fit()}>
          ⌗
        </button>
        <button title="Export Mermaid" onClick={exportMermaid}>
          M
        </button>
      </aside>
      <CanvasGraph
        ref={graph}
        nodes={state.nodes}
        edges={state.edges}
        viewport={viewport}
        selectedId={selectedId}
        connectSourceId={connectSourceId}
        presence={state.presence}
        onViewport={setViewport}
        onSelect={setSelectedId}
        onNodeMove={mutateNode}
        onNodeActivate={activateNode}
      />
      <div className="canvas-zoom">
        <button
          onClick={() =>
            setViewport(
              { ...viewport, zoom: Math.min(3, viewport.zoom * 1.15) },
              true,
            )
          }
        >
          ＋
        </button>
        <span>{Math.round(viewport.zoom * 100)}%</span>
        <button
          onClick={() =>
            setViewport(
              { ...viewport, zoom: Math.max(0.15, viewport.zoom / 1.15) },
              true,
            )
          }
        >
          −
        </button>
      </div>
      {panel === "inspector" && selected && (
        <Inspector
          node={selected}
          comments={comments.filter((c) => c.nodeId === selected.id)}
          onClose={() => setPanel(null)}
          onSave={saveNode}
          onDelete={removeNode}
          onConnect={createEdge}
          onComment={async (body) => {
            const item = await api<Comment>(`/canvases/${canvasId}/comments`, {
              method: "POST",
              body: JSON.stringify({ nodeId: selected.id, body }),
            });
            setComments((c) =>
              c.some((x) => x.id === item.id) ? c : [...c, item],
            );
          }}
          onResolve={async (id) => {
            await api(`/canvases/${canvasId}/comments/${id}/resolve`, {
              method: "PATCH",
            });
            setComments((c) =>
              c.map((x) =>
                x.id === id
                  ? { ...x, resolvedAt: new Date().toISOString() }
                  : x,
              ),
            );
          }}
        />
      )}
      {panel === "repository" && (
        <RepositoryPanel
          project={project}
          analysis={analysis}
          onClose={() => setPanel(null)}
          onAnalyze={async (url, branch) => {
            const item = await api<RepositoryAnalysis>(
              `/projects/${projectId}/repository/analyze`,
              {
                method: "POST",
                body: JSON.stringify({ repositoryUrl: url, branch }),
              },
            );
            setAnalysis(item);
            setProject({ ...project, repositoryUrl: url, branch });
          }}
          onGenerate={async () => {
            await api(`/projects/${projectId}/repository/generate`, {
              method: "POST",
            });
            await refresh();
            setPanel(null);
            graph.current?.fit();
          }}
        />
      )}
      {panel === "history" && (
        <HistoryPanel
          snapshots={snapshots}
          onClose={() => setPanel(null)}
          onCreate={createSnapshot}
        />
      )}
      {searchOpen && (
        <SearchPalette
          query={search}
          results={results}
          onQuery={(q) => void runSearch(q)}
          onClose={() => setSearchOpen(false)}
          onNode={(id) => {
            setSearchOpen(false);
            setSelectedId(id);
            setPanel("inspector");
            graph.current?.focusNode(id);
          }}
        />
      )}
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function Inspector({
  node,
  comments,
  onClose,
  onSave,
  onDelete,
  onConnect,
  onComment,
  onResolve,
}: {
  node: ArchitectureNode;
  comments: Comment[];
  onClose(): void;
  onSave(v: Partial<ArchitectureNode>): Promise<void>;
  onDelete(): Promise<void>;
  onConnect(t: EdgeType): Promise<void>;
  onComment(body: string): Promise<void>;
  onResolve(id: string): Promise<void>;
}) {
  const [label, setLabel] = useState(node.label),
    [technology, setTechnology] = useState(node.technology ?? ""),
    [description, setDescription] = useState(node.description ?? ""),
    [type, setType] = useState<NodeType>(node.type),
    [comment, setComment] = useState("");
  useEffect(() => {
    setLabel(node.label);
    setTechnology(node.technology ?? "");
    setDescription(node.description ?? "");
    setType(node.type);
  }, [node]);
  return (
    <aside className="side-panel inspector">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Node inspector</span>
          <h2>{node.label}</h2>
        </div>
        <button onClick={onClose}>×</button>
      </div>
      <div className="panel-scroll">
        <label>
          Label
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => void onSave({ label })}
          />
        </label>
        <label>
          Type
          <select
            value={type}
            onChange={(e) => {
              const v = e.target.value as NodeType;
              setType(v);
              void onSave({ type: v });
            }}
          >
            {NODE_TYPES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Technology
          <input
            value={technology}
            placeholder="NestJS, PostgreSQL…"
            onChange={(e) => setTechnology(e.target.value)}
            onBlur={() => void onSave({ technology: technology || null })}
          />
        </label>
        <label>
          Description
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => void onSave({ description: description || null })}
          />
        </label>
        <div className="inspector-meta">
          <span>Position</span>
          <code>
            {Math.round(node.x)}, {Math.round(node.y)}
          </code>
        </div>
        <div className="panel-section">
          <div className="section-head">
            <h3>Connect</h3>
          </div>
          <div className="chip-row">
            {EDGE_TYPES.slice(0, 7).map((t) => (
              <button key={t} onClick={() => void onConnect(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-section">
          <div className="section-head">
            <h3>Discussion</h3>
            <span>{comments.filter((c) => !c.resolvedAt).length} open</span>
          </div>
          {comments.map((c) => (
            <article
              className="comment"
              data-resolved={c.resolvedAt ? "true" : "false"}
              key={c.id}
            >
              <strong>{c.user.email.split("@")[0]}</strong>
              <p>{c.body}</p>
              {!c.resolvedAt && (
                <button onClick={() => void onResolve(c.id)}>Resolve</button>
              )}
            </article>
          ))}
          <form
            className="comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              void onComment(comment.trim());
              setComment("");
            }}
          >
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add architecture context…"
            />
            <button className="primary">Comment</button>
          </form>
        </div>
      </div>
      <footer className="panel-footer">
        <button className="danger" onClick={() => void onDelete()}>
          Delete node
        </button>
      </footer>
    </aside>
  );
}

function RepositoryPanel({
  project,
  analysis,
  onClose,
  onAnalyze,
  onGenerate,
}: {
  project: Project;
  analysis: RepositoryAnalysis | null;
  onClose(): void;
  onAnalyze(url: string, branch: string): Promise<void>;
  onGenerate(): Promise<void>;
}) {
  const [url, setUrl] = useState(project.repositoryUrl ?? ""),
    [branch, setBranch] = useState(project.branch || "main"),
    [busy, setBusy] = useState(false);
  return (
    <aside className="side-panel repository-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Code intelligence</span>
          <h2>Repository</h2>
        </div>
        <button onClick={onClose}>×</button>
      </div>
      <div className="panel-scroll">
        <p className="panel-lede">
          SyncForge reads repository structure and imports as untrusted text. It
          never executes repository code.
        </p>
        <label>
          GitHub URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/org/repository"
          />
        </label>
        <label>
          Branch
          <input value={branch} onChange={(e) => setBranch(e.target.value)} />
        </label>
        <button
          className="primary wide"
          disabled={!url || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onAnalyze(url, branch);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Analyzing facts…" : "Analyze repository"}
        </button>
        {analysis?.summary && (
          <div className="analysis-card">
            <div className="analysis-status">
              <i />
              Facts extracted
            </div>
            <h3>
              {analysis.owner}/{analysis.repository}
            </h3>
            <dl>
              <div>
                <dt>Files</dt>
                <dd>{analysis.summary.facts.fileCount}</dd>
              </div>
              <div>
                <dt>Imports</dt>
                <dd>{analysis.summary.facts.importCount}</dd>
              </div>
            </dl>
            <div className="tech-list">
              {analysis.summary.facts.technologies.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            {analysis.summary.inferences.length > 0 && (
              <div className="inference-box">
                <strong>Inferences</strong>
                {analysis.summary.inferences.map((i) => (
                  <p key={i}>{i}</p>
                ))}
              </div>
            )}
            <button className="primary wide" onClick={() => void onGenerate()}>
              Generate initial architecture
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function HistoryPanel({
  snapshots,
  onClose,
  onCreate,
}: {
  snapshots: Snapshot[];
  onClose(): void;
  onCreate(): Promise<void>;
}) {
  return (
    <aside className="side-panel history-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Architecture history</span>
          <h2>Snapshots</h2>
        </div>
        <button onClick={onClose}>×</button>
      </div>
      <div className="panel-scroll">
        <button className="primary wide" onClick={() => void onCreate()}>
          Create checkpoint
        </button>
        <div className="timeline">
          {snapshots.length === 0 && (
            <p className="muted">
              No snapshots yet. Automatic checkpoints are also created as the
              architecture evolves.
            </p>
          )}
          {snapshots.map((s) => (
            <article key={s.id}>
              <i />
              <div>
                <strong>{s.label || `Version ${s.version}`}</strong>
                <span>
                  v{s.version} · {new Date(s.createdAt).toLocaleString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SearchPalette({
  query,
  results,
  onQuery,
  onClose,
  onNode,
}: {
  query: string;
  results: SearchResults;
  onQuery(q: string): void;
  onClose(): void;
  onNode(id: string): void;
}) {
  return (
    <div
      className="command-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="command-palette">
        <div className="command-input">
          <span>⌕</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search nodes, code files, comments…"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="command-results">
          {query.length < 2 ? (
            <p>Type at least two characters to explore this architecture.</p>
          ) : (
            <>
              {results.nodes.length > 0 && (
                <div>
                  <h4>Architecture</h4>
                  {results.nodes.map((n) => (
                    <button key={n.id} onClick={() => onNode(n.id)}>
                      <span>
                        {n.label}
                        <small>{n.technology || n.type}</small>
                      </span>
                      <b>↵</b>
                    </button>
                  ))}
                </div>
              )}
              {results.files.length > 0 && (
                <div>
                  <h4>Related files</h4>
                  {results.files.map((f) => (
                    <button key={f.id}>
                      <span>
                        {f.path}
                        <small>{f.language}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {results.comments.length > 0 && (
                <div>
                  <h4>Comments</h4>
                  {results.comments.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => c.nodeId && onNode(c.nodeId)}
                    >
                      <span>{c.body}</span>
                    </button>
                  ))}
                </div>
              )}
              {!results.nodes.length &&
                !results.files.length &&
                !results.comments.length && <p>No matches found.</p>}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
