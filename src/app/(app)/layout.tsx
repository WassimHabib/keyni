import { requireUser } from "@/features/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import { userWithoutSecrets } from "@/features/users/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <AppShell user={userWithoutSecrets(user)}>{children}</AppShell>;
}
