import type { QuestionnaireAnswers, QuestionnaireProgress, QuestionnaireSchema } from "./schema.mjs";

export function getQuestionnaireProgress(schema: QuestionnaireSchema, answers: QuestionnaireAnswers): QuestionnaireProgress;
export function countDiscardedAnsweredQuestions(schema: QuestionnaireSchema, previousAnswers: QuestionnaireAnswers, nextAnswers: QuestionnaireAnswers): number;
export function reconcileQuestionnaireAnswers(
  schema: QuestionnaireSchema,
  currentAnswers: QuestionnaireAnswers,
  changedQuestionId: string,
  nextValue: unknown,
): QuestionnaireProgress & { answers: QuestionnaireAnswers; error: string | null };
export function validateQuestionnaireAnswers(
  schema: QuestionnaireSchema,
  answers: QuestionnaireAnswers,
): Array<{ questionId: string | null; code: string }>;
export function mapVisibleQuestionnaireDraft(schema: QuestionnaireSchema, answers?: QuestionnaireAnswers): QuestionnaireAnswers;
export function mapQuestionnaireAnswers(
  schema: QuestionnaireSchema,
  answers: QuestionnaireAnswers,
): { ok: true; values: QuestionnaireAnswers } | { ok: false; errors: Array<{ questionId: string | null; code: string }> };
