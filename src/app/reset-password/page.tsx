import { AuthShell } from "@/features/auth/auth-shell";
import { RecoveryForm } from "@/features/auth/recovery-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const query = await searchParams;
  return (
    <AuthShell view="reset-password">
      <RecoveryForm
        mode="reset"
        token={typeof query.token === "string" ? query.token : ""}
        invalid={!!query.error}
      />
    </AuthShell>
  );
}
