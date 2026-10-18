import type { QuestionnaireSchema } from "./schema.mjs";

export const MAX_QUESTIONNAIRE_REQUEST_BYTES: number;
export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; code: "invalid-json" | "body-too-large" };
export function readBoundedJsonBody(request: Request, maxBytes?: number): Promise<BoundedJsonResult>;
export type QuestionnaireRequestResult = { status: number; body: Record<string, unknown> };
export function validateQuestionnaireRequest(
  body: unknown,
  resolveSchema: (sectorId: string) => QuestionnaireSchema | undefined,
): QuestionnaireRequestResult;
export function handleQuestionnaireValidationRequest(
  request: Request,
  resolveSchema: (sectorId: string) => QuestionnaireSchema | undefined,
): Promise<Response>;
