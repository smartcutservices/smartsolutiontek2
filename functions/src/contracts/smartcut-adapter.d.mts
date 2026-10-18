export class SmartCutNotConfiguredError extends Error {
  readonly code: "SMARTCUT_NOT_CONFIGURED";
}

/**
 * Internal capability placeholder only. These method names are not an
 * external SmartCut API schema and accept no trusted payment payload yet.
 */
export type UnconfiguredSmartCutAdapter = Readonly<{
  createPaymentIntent(command: unknown): Promise<never>;
  verifyPaymentStatus(reference: unknown): Promise<never>;
  createRefund(command: unknown): Promise<never>;
}>;

export function createUnconfiguredSmartCutAdapter(): UnconfiguredSmartCutAdapter;
