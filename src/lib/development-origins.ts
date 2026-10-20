/** Explicit local development origins; never expand production trust. */
export function developmentOrigins(
  baseURL: string | undefined,
  mode: string | undefined,
): string[] {
  if (mode !== "development" || !baseURL) return [];
  const url = new URL(baseURL);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("BETTER_AUTH_URL must use HTTP or HTTPS.");
  return [
    ...new Set([
      url.origin,
      `${url.protocol}//localhost${url.port ? `:${url.port}` : ""}`,
      `${url.protocol}//127.0.0.1${url.port ? `:${url.port}` : ""}`,
    ]),
  ];
}
