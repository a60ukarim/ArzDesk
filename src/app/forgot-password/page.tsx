import { AuthShell } from "@/features/auth/auth-shell";
import { RecoveryForm } from "@/features/auth/recovery-form";
import { getEmailDeliveryMode } from "@/lib/mail";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <AuthShell view="forgot-password">
      <RecoveryForm mode="request" delivery={getEmailDeliveryMode()} />
    </AuthShell>
  );
}
