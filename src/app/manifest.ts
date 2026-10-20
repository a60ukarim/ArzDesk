import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ArzDesk",
    short_name: "ArzDesk",
    description: "Your clients, projects and tasks in one workspace.",
    start_url: "/start",
    scope: "/",
    display: "standalone",
    background_color: "#dfe4ec",
    theme_color: "#5145d9",
    icons: [
      {
        src: "/arzdesk-logo-v1.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
