import Link from "next/link";
import { Brand } from "@/components/brand";
export default function NotFound() {
  return (
    <main className="center-page">
      <Brand />
      <h1 style={{ marginTop: 30 }}>Page not found</h1>
      <p>
        This page is unavailable, or you do not have access to this workspace.
      </p>
      <Link className="btn btn-primary" href="/workspaces">
        Back to workspaces
      </Link>
    </main>
  );
}
