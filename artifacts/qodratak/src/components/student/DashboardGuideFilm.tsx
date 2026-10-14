import { RoleGuideFilm } from "@/components/RoleGuideFilm";

export function DashboardGuideFilm({ studentId, displayName }: { studentId: unknown; displayName?: string }) {
  return <RoleGuideFilm audience="student" viewerId={studentId} displayName={displayName} />;
}
