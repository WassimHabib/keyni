import { redirectIfAuthenticated } from "@/features/auth/guards";
import { Logo } from "@/components/layout/logo";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfAuthenticated();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8">
        <Logo size="lg" href="" />
      </div>
      <main className="w-full max-w-md">{children}</main>
      <p className="mt-10 text-xs text-text-muted">
        © {new Date().getFullYear()} Keyni — Néo-assureur immobilier
      </p>
    </div>
  );
}
