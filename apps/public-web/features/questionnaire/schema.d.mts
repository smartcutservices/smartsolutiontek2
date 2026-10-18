export type QuestionnaireType =
  | "shortText" | "longText" | "email" | "phone" | "number" | "amount" | "singleChoice" | "multipleChoice"
  | "yesNo" | "date" | "dateTime" | "file" | "image" | "logo" | "color" | "font" | "address" | "geographicArea"
  | "repeatableList" | "order" | "sectionChoice";
export type QuestionnaireRule = { questionId: string; operator: "answered" | "equals" | "notEquals" | "contains"; value?: string | number | boolean };
export type QuestionnaireQuestion = {
  id: string; version: string; type: QuestionnaireType; label: string; help?: string; required: boolean; default?: unknown;
  validation?: { minLength?: number; maxLength?: number; min?: number; max?: number; minItems?: number; maxItems?: number };
  visibilityRules?: QuestionnaireRule[]; requiredWhen?: QuestionnaireRule[]; dependencies?: string[]; answerMapping?: { targetKey: string }; analyticsTag?: string;
  permissions?: string[]; options?: Array<{ id: string; label: string }>;
};
export type QuestionnaireSchema = { schemaId: string; schemaVersion: string; locale: string; questions: QuestionnaireQuestion[] };
export type QuestionnaireAnswers = Record<string, unknown>;
export type QuestionnaireProgress = { visibleQuestionIds: string[]; currentQuestionId: string | null; answeredCount: number; total: number };
export function validateQuestionnaireSchema(schema: unknown): string[];
export function getQuestionnaireProgress(schema: QuestionnaireSchema, answers: QuestionnaireAnswers): QuestionnaireProgress;
export function reconcileQuestionnaireAnswers(schema: QuestionnaireSchema, currentAnswers: QuestionnaireAnswers, changedQuestionId: string, nextValue: unknown): QuestionnaireProgress & { answers: QuestionnaireAnswers; error: string | null };
