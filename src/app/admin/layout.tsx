import { requireAdmin } from "@/features/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { userWithoutSecrets } from "@/features/users/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return <AdminShell user={userWithoutSecrets(user)}>{children}</AdminShell>;
}
