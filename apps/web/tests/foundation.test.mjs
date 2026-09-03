import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the architecture workspace keeps its approved empty-state contract", async () => {
  const source = await readSource("../src/app/page.tsx");
  assert.match(source, /Architecture workspace/);
  assert.match(source, /No architecture selected/);
  assert.match(
    source,
    /Choose or create a project to begin mapping how your software works\./,
  );
  assert.match(source, /href="\/projects\/new"/);
});

test("the shell provides real project and settings navigation", async () => {
  const source = await readSource("../src/components/app-shell.tsx");
  assert.match(source, /href: "\/"/);
  assert.match(source, /href: "\/settings"/);
  assert.match(source, /aria-current/);
});

test("responsive and accessibility foundations remain explicit", async () => {
  const styles = await readSource("../src/app/globals.css");
  assert.match(styles, /@media \(max-width: 45rem\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /\.bottom-nav/);
});
