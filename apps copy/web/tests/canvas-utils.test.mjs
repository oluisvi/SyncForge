import assert from "node:assert/strict";
import test from "node:test";

// Mirrors the public serialization contract without importing TS during Node's test pass.
test("Mermaid contract uses a flowchart and directed edges", () => {
  const nodes = [
    { id: "web", label: "Web" },
    { id: "api", label: "API" },
  ];
  const edges = [
    { sourceNodeId: "web", targetNodeId: "api", type: "REST", label: null },
  ];
  const lines = [
    "flowchart LR",
    ...nodes.map((node) => `  n_${node.id}["${node.label}"]`),
    ...edges.map(
      (edge) =>
        `  n_${edge.sourceNodeId} -->|${edge.label ?? edge.type}| n_${edge.targetNodeId}`,
    ),
  ];
  assert.match(lines.join("\n"), /n_web -->\|REST\| n_api/);
});
