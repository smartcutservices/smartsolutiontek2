export function getConfiguredPublicOrigin(): string | undefined {
  const configuredOrigin = process.env.PUBLIC_SITE_ORIGIN?.trim();
  if (!configuredOrigin) return undefined;

  try {
    const url = new URL(configuredOrigin);
    const isLocalHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if ((url.protocol !== "https:" && !isLocalHttp) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export function getIndexablePublicOrigin(): string | undefined {
  if (process.env.VERCEL_ENV !== "production") return undefined;
  const origin = getConfiguredPublicOrigin();
  return origin?.startsWith("https://") ? origin : undefined;
}
