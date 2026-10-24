"use client";
import { createContext, useContext } from "react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { mutate as serverMutate } from "./actions";
import type { ActionResult } from "./actions";
export type LocalRuntime = {
  section: string;
  base: string;
  mutate: (
    action: string,
    orgId: string,
    data: Record<string, string>,
  ) => Promise<ActionResult>;
  refresh: () => void;
  settings: React.ReactNode;
};
export const WorkspaceRuntime = createContext<LocalRuntime | null>(null);
export function useWorkspaceRuntime() {
  const local = useContext(WorkspaceRuntime);
  const router = useRouter();
  return {
    local,
    mutate: local?.mutate ?? serverMutate,
    router: local
      ? {
          refresh: local.refresh,
          prefetch: () => {},
          push: (href: string) => {
            window.location.hash = href.split("#")[1] ?? "";
          },
        }
      : router,
  };
}

// Hash links in device workspaces never invoke the server router or prefetch RSC.
export function WorkspaceLink({
  prefetch,
  ...props
}: ComponentProps<"a"> & { href: string; prefetch?: boolean }) {
  const local = useContext(WorkspaceRuntime);
  return local ? <a {...props} /> : <Link {...props} prefetch={prefetch} />;
}
