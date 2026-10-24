"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function AccountBack() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Back"
      className="back-workspace"
      onClick={() => {
        let target = "/cloud";
        try {
          const saved = sessionStorage.getItem("arzdesk-account-return") || "";
          // Only known local application pages are valid return destinations.
          if (
            /^\/w\/[a-zA-Z0-9-]+\/(overview|clients|projects|tasks|team|settings)(?:[?#]|$)/.test(
              saved,
            ) ||
            saved === "/workspaces"
          )
            target = saved;
        } catch {}
        router.replace(target);
      }}
    >
      <ArrowLeft size={16} />
      <span>Back</span>
    </button>
  );
}
