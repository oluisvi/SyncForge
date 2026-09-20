import { ProjectRedirect } from "@/components/project-redirect";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectRedirect projectId={projectId} />;
}
