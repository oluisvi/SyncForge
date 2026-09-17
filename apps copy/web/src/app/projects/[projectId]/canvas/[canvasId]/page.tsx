import { CanvasWorkspace } from "@/components/canvas/canvas-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; canvasId: string }>;
}) {
  const { projectId, canvasId } = await params;
  return <CanvasWorkspace projectId={projectId} canvasId={canvasId} />;
}
