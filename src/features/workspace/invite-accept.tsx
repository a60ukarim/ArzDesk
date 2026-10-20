"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { mutate } from "./actions";
export function InviteAccept({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <>
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const result = await mutate("invite.accept", "", { token });
            if (!result.ok) {
              setError(result.error);
              setBusy(false);
              return;
            }
            router.push(`/w/${result.id}`);
          } catch {
            setError("Could not accept this invitation. Try again.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Joining…" : "Accept invitation"}
      </Button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
