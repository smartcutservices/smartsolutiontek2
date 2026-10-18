import type { RegistrationSiteConfigDraft } from "./registration-types";

export type QuestionnaireAnswers = Record<string, unknown>;
export type QuestionnaireProgress = {
  visibleFieldIds: string[];
  currentQuestionId: string | null;
  answeredCount: number;
  total: number;
};
export type ReconciledQuestionnaireAnswers = {
  answers: QuestionnaireAnswers;
  visibleFieldIds: string[];
  currentQuestionId: string | null;
  error: string | null;
};

export function reconcileQuestionnaireAnswers(
  config: RegistrationSiteConfigDraft,
  currentAnswers: QuestionnaireAnswers,
  changedFieldId: string,
  nextValue: unknown,
): ReconciledQuestionnaireAnswers;
export function getQuestionnaireProgress(
  config: RegistrationSiteConfigDraft,
  answers: QuestionnaireAnswers,
): QuestionnaireProgress;
export function validateQuestionnaireAnswers(
  config: RegistrationSiteConfigDraft,
  answers: QuestionnaireAnswers,
): Array<{ fieldId: string | null; code: string }>;
