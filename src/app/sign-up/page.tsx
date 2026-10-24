import { AuthShell } from "@/features/auth/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell view="sign-up">
      <AuthForm mode="sign-up" next={next ?? "/cloud"} />
    </AuthShell>
  );
}
