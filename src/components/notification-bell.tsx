"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X } from "lucide-react";
import { mutate } from "@/features/workspace/actions";
import { Button } from "@/components/ui/button";

type IncomingInvitation = {
  id: string;
  organizationId: string;
  organizationName: string;
  role: "owner" | "admin" | "member" | "viewer";
  expiresAt: string;
  createdAt: string;
};

export function NotificationBell() {
  const router = useRouter();
  const host = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState<IncomingInvitation[]>([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) return;
        const body = (await response.json()) as {
          invitations?: IncomingInvitation[];
        };
        if (active && Array.isArray(body.invitations)) {
          setInvitations(body.invitations);
        }
      } catch {
        // An unavailable connection must not block the rest of the workspace.
      }
    }
    void load();
    const interval = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 45000);
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", focus);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (host.current && !host.current.contains(event.target as Node))
        setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  async function respond(
    invitation: IncomingInvitation,
    decision: "accept" | "decline",
  ) {
    setBusyId(invitation.id);
    setError("");
    try {
      const result = await mutate("invite.respond", "", {
        id: invitation.id,
        decision,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInvitations((items) => items.filter((i) => i.id !== invitation.id));
      if (decision === "accept") {
        setOpen(false);
        router.push(`/w/${result.id}/overview`);
        router.refresh();
      }
    } catch {
      setError("Could not respond to the invitation. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div ref={host} className="notification-host">
      <button
        type="button"
        className="notification-trigger"
        aria-label={`Notifications, ${invitations.length} pending invitations`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
      >
        <Bell size={19} aria-hidden="true" />
        {!!invitations.length && (
          <span className="notification-count" aria-hidden="true">
            {invitations.length > 9 ? "9+" : invitations.length}
          </span>
        )}
      </button>
      {open && (
        <section className="notification-panel" aria-label="Notifications">
          <header className="notification-heading">
            <div>
              <h2>Notifications</h2>
              <p>
                {invitations.length} pending{" "}
                {invitations.length === 1 ? "invitation" : "invitations"}
              </p>
            </div>
            <button
              className="notification-close"
              aria-label="Close notifications"
              type="button"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </header>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {invitations.length === 0 ? (
            <p className="notification-empty">
              You’re all caught up. New team invitations will show up here.
            </p>
          ) : (
            <div className="notification-list">
              {invitations.map((invite) => (
                <article className="notification-entry" key={invite.id}>
                  <strong dir="auto">{invite.organizationName}</strong>
                  <p>You&apos;re invited to join as {invite.role}.</p>
                  <small>
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </small>
                  <div className="notification-actions">
                    <Button
                      size="sm"
                      type="button"
                      disabled={!!busyId}
                      onClick={() => void respond(invite, "accept")}
                    >
                      <Check size={14} /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      disabled={!!busyId}
                      onClick={() => void respond(invite, "decline")}
                    >
                      Decline
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="notification-footnote">
            Only invitations for your signed-in email appear here. The page
            checks for new invitations while you&apos;re online.
          </p>
        </section>
      )}
    </div>
  );
}
