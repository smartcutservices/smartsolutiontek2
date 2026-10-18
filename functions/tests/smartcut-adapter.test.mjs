import assert from "node:assert/strict";
import test from "node:test";
import { createUnconfiguredSmartCutAdapter, SmartCutNotConfiguredError } from "../src/contracts/smartcut-adapter.mjs";

test("payment intent capability fails closed while SmartCut contract is absent", async () => {
  const adapter = createUnconfiguredSmartCutAdapter();
  await assert.rejects(adapter.createPaymentIntent({ amount: 1 }), (error) => {
    assert.ok(error instanceof SmartCutNotConfiguredError);
    assert.equal(error.code, "SMARTCUT_NOT_CONFIGURED");
    return true;
  });
});

test("status verification capability cannot confirm a payment", async () => {
  const adapter = createUnconfiguredSmartCutAdapter();
  await assert.rejects(adapter.verifyPaymentStatus("untrusted-reference"), { code: "SMARTCUT_NOT_CONFIGURED" });
});

test("refund capability fails closed and adapter exposes no mutable state", async () => {
  const adapter = createUnconfiguredSmartCutAdapter();
  assert.equal(Object.isFrozen(adapter), true);
  await assert.rejects(adapter.createRefund({ reference: "untrusted-reference" }), { code: "SMARTCUT_NOT_CONFIGURED" });
});
