"use client";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { clampZoom, edgePath } from "@/lib/canvas-utils";
import type { ArchitectureEdge, ArchitectureNode, Presence } from "@/lib/types";

export type Viewport = { x: number; y: number; zoom: number };
export type CanvasGraphHandle = { fit(): void; focusNode(id: string): void };

type Props = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  viewport: Viewport;
  selectedId: string | null;
  connectSourceId: string | null;
  presence: Presence[];
  onViewport(viewport: Viewport, commit: boolean): void;
  onSelect(id: string | null): void;
  onNodeMove(id: string, x: number, y: number, commit: boolean): void;
  onNodeActivate(id: string): void;
};

function GraphNode({
  node,
  selected,
  connecting,
  peers,
  onSelect,
  onMove,
  onActivate,
  viewport,
}: {
  node: ArchitectureNode;
  selected: boolean;
  connecting: boolean;
  peers: Presence[];
  viewport: Viewport;
  onSelect(): void;
  onMove(x: number, y: number, commit: boolean): void;
  onActivate(): void;
}) {
  const drag = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);
  return (
    <article
      className="arch-node"
      data-type={node.type}
      data-selected={selected ? "true" : "false"}
      data-connecting={connecting ? "true" : "false"}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: node.width ?? 240,
        height: node.height ?? 112,
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          x: node.x,
          y: node.y,
        };
        onSelect();
      }}
      onPointerMove={(event) => {
        const d = drag.current;
        if (!d || d.pointerId !== event.pointerId) return;
        const x = d.x + (event.clientX - d.clientX) / viewport.zoom;
        const y = d.y + (event.clientY - d.clientY) / viewport.zoom;
        onMove(x, y, false);
      }}
      onPointerUp={(event) => {
        const d = drag.current;
        if (!d || d.pointerId !== event.pointerId) return;
        const moved =
          Math.hypot(event.clientX - d.clientX, event.clientY - d.clientY) > 4;
        drag.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        if (moved) {
          const x = d.x + (event.clientX - d.clientX) / viewport.zoom;
          const y = d.y + (event.clientY - d.clientY) / viewport.zoom;
          onMove(x, y, true);
        } else onActivate();
      }}
    >
      <div className="node-accent" />
      <header>
        <span className="node-kind">{node.type.toLowerCase()}</span>
        {peers.length > 0 && (
          <span
            className="node-peer-stack"
            title={peers.map((p) => p.email).join(", ")}
          >
            {peers.slice(0, 3).map((peer) => (
              <i key={peer.userId}>{peer.email.slice(0, 1).toUpperCase()}</i>
            ))}
          </span>
        )}
      </header>
      <h3>{node.label}</h3>
      <p>{node.technology || node.description || "Architecture component"}</p>
      <div className="node-port in" />
      <div className="node-port out" />
    </article>
  );
}

export const CanvasGraph = forwardRef<CanvasGraphHandle, Props>(
  function CanvasGraph(
    {
      nodes,
      edges,
      viewport,
      selectedId,
      connectSourceId,
      presence,
      onViewport,
      onSelect,
      onNodeMove,
      onNodeActivate,
    },
    ref,
  ) {
    const container = useRef<HTMLDivElement>(null);
    const pan = useRef<{
      pointerId: number;
      clientX: number;
      clientY: number;
      x: number;
      y: number;
    } | null>(null);
    const nodeMap = useMemo(
      () => new Map(nodes.map((node) => [node.id, node])),
      [nodes],
    );
    function fit() {
      const element = container.current;
      if (!element || nodes.length === 0) return;
      const minX = Math.min(...nodes.map((n) => n.x));
      const minY = Math.min(...nodes.map((n) => n.y));
      const maxX = Math.max(...nodes.map((n) => n.x + (n.width ?? 240)));
      const maxY = Math.max(...nodes.map((n) => n.y + (n.height ?? 112)));
      const bounds = element.getBoundingClientRect();
      const padding = 120;
      const zoom = clampZoom(
        Math.min(
          (bounds.width - padding) / Math.max(300, maxX - minX),
          (bounds.height - padding) / Math.max(200, maxY - minY),
          1.1,
        ),
      );
      onViewport(
        {
          zoom,
          x: bounds.width / 2 - ((minX + maxX) / 2) * zoom,
          y: bounds.height / 2 - ((minY + maxY) / 2) * zoom,
        },
        true,
      );
    }
    function focusNode(id: string) {
      const element = container.current;
      const node = nodeMap.get(id);
      if (!element || !node) return;
      const bounds = element.getBoundingClientRect();
      const zoom = Math.max(viewport.zoom, 0.75);
      onViewport(
        {
          zoom,
          x: bounds.width / 2 - (node.x + (node.width ?? 240) / 2) * zoom,
          y: bounds.height / 2 - (node.y + (node.height ?? 112) / 2) * zoom,
        },
        true,
      );
    }
    useImperativeHandle(ref, () => ({ fit, focusNode }), [
      nodes,
      nodeMap,
      viewport.zoom,
    ]);
    return (
      <div
        ref={container}
        className="canvas-graph"
        tabIndex={0}
        role="application"
        aria-label="Architecture canvas"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          if (
            event.target !== event.currentTarget &&
            !(event.target as HTMLElement).classList.contains("canvas-grid")
          )
            return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pan.current = {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            x: viewport.x,
            y: viewport.y,
          };
          onSelect(null);
        }}
        onPointerMove={(event) => {
          const d = pan.current;
          if (!d || d.pointerId !== event.pointerId) return;
          onViewport(
            {
              ...viewport,
              x: d.x + event.clientX - d.clientX,
              y: d.y + event.clientY - d.clientY,
            },
            false,
          );
        }}
        onPointerUp={(event) => {
          const d = pan.current;
          if (!d || d.pointerId !== event.pointerId) return;
          const next = {
            ...viewport,
            x: d.x + event.clientX - d.clientX,
            y: d.y + event.clientY - d.clientY,
          };
          pan.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
          onViewport(next, true);
        }}
        onWheel={(event) => {
          event.preventDefault();
          const element = container.current;
          if (!element) return;
          const bounds = element.getBoundingClientRect();
          const previous = viewport.zoom;
          const next = clampZoom(previous * (event.deltaY > 0 ? 0.9 : 1.1));
          const px = event.clientX - bounds.left;
          const py = event.clientY - bounds.top;
          const wx = (px - viewport.x) / previous;
          const wy = (py - viewport.y) / previous;
          onViewport(
            { zoom: next, x: px - wx * next, y: py - wy * next },
            false,
          );
        }}
      >
        <div
          className="canvas-grid"
          style={{
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
            backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
          }}
        />
        <div
          className="canvas-world"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          }}
        >
          <svg
            className="edge-layer"
            width="4000"
            height="3000"
            viewBox="-1000 -800 4000 3000"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="edge-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const source = nodeMap.get(edge.sourceNodeId);
              const target = nodeMap.get(edge.targetNodeId);
              if (!source || !target) return null;
              return (
                <g key={edge.id} className="edge-group">
                  <path
                    className="edge-line-shadow"
                    d={edgePath(source, target)}
                  />
                  <path
                    className="edge-line"
                    markerEnd="url(#edge-arrow)"
                    d={edgePath(source, target)}
                  />
                  {edge.label && (
                    <text
                      className="edge-label"
                      x={(source.x + target.x) / 2 + 100}
                      y={(source.y + target.y) / 2 + 44}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {nodes.map((node) => (
            <GraphNode
              key={node.id}
              node={node}
              selected={selectedId === node.id}
              connecting={connectSourceId === node.id}
              peers={presence.filter((p) => p.nodeId === node.id)}
              viewport={viewport}
              onSelect={() => onSelect(node.id)}
              onMove={(x, y, commit) => onNodeMove(node.id, x, y, commit)}
              onActivate={() => onNodeActivate(node.id)}
            />
          ))}
        </div>
        {nodes.length === 0 && (
          <div className="canvas-empty">
            <div className="empty-forge" aria-hidden="true">
              <i />
              <i />
              <i />
              <span />
              <span />
            </div>
            <h2>Forge the first component</h2>
            <p>
              Add a node manually, or analyze a GitHub repository to generate an
              initial architecture from code facts.
            </p>
          </div>
        )}
      </div>
    );
  },
);
