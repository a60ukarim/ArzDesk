import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; password?: string }>;
}) {
  const query = await searchParams;
  if ("password" in query) redirect("/sign-in");
  const { next, error } = query;
  return (
    <AuthShell view="sign-in">
      <AuthForm
        mode="sign-in"
        next={next ?? "/cloud"}
        pageNotReady={error === "page-not-ready"}
      />
    </AuthShell>
  );
}
