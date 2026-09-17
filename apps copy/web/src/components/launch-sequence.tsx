"use client";
import { useEffect, useState } from "react";

export function LaunchSequence({ ready }: { ready: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const started = performance.now();
    if (!ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimum = reduced ? 0 : 850;
    const remaining = Math.max(0, minimum - (performance.now() - started));
    const timer = window.setTimeout(() => setVisible(false), remaining + (reduced ? 0 : 220));
    return () => window.clearTimeout(timer);
  }, [ready]);
  if (!visible) return null;
  return (
    <div className="launch-sequence" data-ready={ready ? "true" : "false"} aria-hidden="true">
      <div className="forge-mark">
        <span className="forge-node forge-node-a" /><span className="forge-node forge-node-b" /><span className="forge-node forge-node-c" /><span className="forge-node forge-node-d" />
        <span className="forge-line forge-line-a" /><span className="forge-line forge-line-b" /><span className="forge-line forge-line-c" />
      </div>
      <div className="launch-wordmark">SyncForge</div>
      <div className="launch-caption">architecture, made visible</div>
    </div>
  );
}
