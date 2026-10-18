/**
 * Fail-closed local placeholder for the future server-side SmartCut adapter.
 * Method names describe internal capabilities, not external SmartCut endpoints.
 * Replace only after the official contract and sandbox are reviewed.
 */
export class SmartCutNotConfiguredError extends Error {
  constructor() {
    super("SmartCut integration is not configured.");
    this.name = "SmartCutNotConfiguredError";
    this.code = "SMARTCUT_NOT_CONFIGURED";
  }
}

async function unavailable() {
  throw new SmartCutNotConfiguredError();
}

/** No network access or payment-success path exists in this adapter. */
export function createUnconfiguredSmartCutAdapter() {
  return Object.freeze({
    createPaymentIntent: unavailable,
    verifyPaymentStatus: unavailable,
    createRefund: unavailable,
  });
}
