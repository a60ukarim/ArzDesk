import { getApprovedRelease } from "@/lib/desktop-releases";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const release = getApprovedRelease(platform);
  if (!release)
    return Response.json(
      {
        error:
          "This installer is still being tested and is not available for public download.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "86400" },
      },
    );
  return new Response(null, {
    status: 307,
    headers: { Location: release.url, "Cache-Control": "no-store" },
  });
}
