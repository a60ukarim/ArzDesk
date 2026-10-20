import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { SignOut } from "@/components/sign-out";
import { InviteAccept } from "@/features/workspace/invite-accept";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    redirect(`/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`);
  return (
    <main className="center-page">
      <Brand />
      <h1 style={{ marginTop: 30 }}>You’re invited.</h1>
      <p>
        Join your team’s workspace. This invitation must match your signed-in
        email: <strong>{session.user.email}</strong>.
      </p>
      <InviteAccept token={token} />
      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span className="muted">Wrong account? Sign out</span>
        <SignOut />
      </div>
    </main>
  );
}
