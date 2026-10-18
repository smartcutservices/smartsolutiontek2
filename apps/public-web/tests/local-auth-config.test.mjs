import assert from "node:assert/strict";
import test from "node:test";
import { isLocalAuthEmulatorConfig } from "../features/auth/local-auth-config.mjs";

test("allows only the dedicated local Auth emulator", () => {
  assert.equal(isLocalAuthEmulatorConfig({ projectId: "demo-smartsolutiontek", emulatorUrl: "http://127.0.0.1:9099" }), true);
  assert.equal(isLocalAuthEmulatorConfig({ projectId: "demo-smartsolutiontek", emulatorUrl: "http://localhost:9099/" }), true);
});

test("fails closed for shared, live, remote, or malformed Auth targets", () => {
  for (const configuration of [
    undefined,
    { projectId: "smartcutservices-9ce54", emulatorUrl: "http://127.0.0.1:9099" },
    { projectId: "smartsolutiontek-dev", emulatorUrl: "http://127.0.0.1:9099" },
    { projectId: "demo-smartsolutiontek" },
    { projectId: "demo-smartsolutiontek", emulatorUrl: "https://127.0.0.1:9099" },
    { projectId: "demo-smartsolutiontek", emulatorUrl: "http://example.com:9099" },
    { projectId: "demo-smartsolutiontek", emulatorUrl: "http://127.0.0.1:9098" },
    { projectId: "demo-smartsolutiontek", emulatorUrl: "http://127.0.0.1:9099/auth" },
    { projectId: "demo-smartsolutiontek", emulatorUrl: "http://user:pass@127.0.0.1:9099" },
  ]) {
    assert.equal(isLocalAuthEmulatorConfig(configuration), false);
  }
});
