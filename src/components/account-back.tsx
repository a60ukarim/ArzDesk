"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getWorkspaceReturn } from "@/lib/workspace-return";

export function AccountBack() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Back"
      className="back-workspace"
      onClick={() => {
        const target = getWorkspaceReturn("account", "/cloud");
        router.replace(target);
      }}
    >
      <ArrowLeft size={16} />
      <span>Back</span>
    </button>
  );
}
