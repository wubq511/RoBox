import { requireAppUser } from "@/server/auth/session";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAppUser("/dashboard");

  return <WorkspaceShell userEmail={user.email}>{children}</WorkspaceShell>;
}
