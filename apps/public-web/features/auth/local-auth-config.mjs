const localHosts = new Set(["localhost", "127.0.0.1"]);

/** Allow browser authentication only against the dedicated local demo project. */
export function isLocalAuthEmulatorConfig({ projectId, emulatorUrl } = {}) {
  if (projectId !== "demo-smartsolutiontek" || typeof emulatorUrl !== "string") return false;
  try {
    const url = new URL(emulatorUrl);
    return url.protocol === "http:"
      && localHosts.has(url.hostname)
      && url.port === "9099"
      && url.pathname === "/"
      && !url.username
      && !url.password
      && !url.search
      && !url.hash;
  } catch {
    return false;
  }
}
