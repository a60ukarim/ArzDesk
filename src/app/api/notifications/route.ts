import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { workspace } from "@/features/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Sign in required." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });

  const invitations = await workspace.listPendingInvitations(session.user.id);
  return NextResponse.json({ invitations }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
