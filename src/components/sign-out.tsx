"use client";
import { useState } from "react";
import { LogOut, LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
export function SignOut() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="logout-control">
      <Button
        variant="destructive"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const result = await authClient.signOut();
            if (result.error) throw new Error();
            // A single document navigation clears cached private RSC views too.
            window.location.replace("/sign-in");
          } catch {
            setError("Could not log out. Please try again.");
            setBusy(false);
          }
        }}
      >
        {busy ? (
          <LoaderCircle size={17} className="spin" />
        ) : (
          <LogOut size={17} />
        )}
        {busy ? "Logging out…" : "Logout"}
      </Button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
