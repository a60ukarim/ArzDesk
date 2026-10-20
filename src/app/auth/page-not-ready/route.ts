/** No account mutation or credential processing: safe fallback before hydration. */
export async function POST() {
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/sign-in?error=page-not-ready",
      "Cache-Control": "no-store",
    },
  });
}
