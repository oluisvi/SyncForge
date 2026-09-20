import type { ArchitectureNode, CanvasState } from "./types";
export function nodeCenter(
  node: Pick<ArchitectureNode, "x" | "y" | "width" | "height">,
) {
  return {
    x: node.x + (node.width ?? 240) / 2,
    y: node.y + (node.height ?? 112) / 2,
  };
}
export function edgePath(
  source: ArchitectureNode,
  target: ArchitectureNode,
): string {
  const a = nodeCenter(source);
  const b = nodeCenter(target);
  const dx = Math.max(80, Math.abs(b.x - a.x) * 0.45);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}
export function mermaid(state: Pick<CanvasState, "nodes" | "edges">): string {
  const safe = (value: string) => value.replace(/["[\]{}]/g, "").slice(0, 80);
  const id = (value: string) => `n_${value.replace(/[^A-Za-z0-9_]/g, "_")}`;
  const lines = ["flowchart LR"];
  for (const node of state.nodes)
    lines.push(`  ${id(node.id)}["${safe(node.label)}"]`);
  for (const edge of state.edges)
    lines.push(
      `  ${id(edge.sourceNodeId)} -->|${safe(edge.label ?? edge.type)}| ${id(edge.targetNodeId)}`,
    );
  return lines.join("\n");
}
export function clampZoom(value: number): number {
  return Math.min(2.4, Math.max(0.25, value));
}
export function screenToWorld(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
  viewport: { x: number; y: number; zoom: number },
) {
  return {
    x: (clientX - bounds.left - viewport.x) / viewport.zoom,
    y: (clientY - bounds.top - viewport.y) / viewport.zoom,
  };
}
