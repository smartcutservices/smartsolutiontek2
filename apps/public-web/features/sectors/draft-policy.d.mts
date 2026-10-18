import type { QuestionnaireAnswers, QuestionnaireSchema } from "../questionnaire/schema.mjs";

export type SectorDraftRecord = {
  schemaId: string;
  schemaVersion: string;
  answers: QuestionnaireAnswers;
  updatedAt: number;
  basedOnUpdatedAt: number;
  tabId: string;
  deleted?: boolean;
};
export function isQuestionnaireAnswerRecord(value: unknown): value is QuestionnaireAnswers;
export function sanitizeSectorDraftAnswers(schema: QuestionnaireSchema, answers: QuestionnaireAnswers): { answers: QuestionnaireAnswers; changed: boolean };
export function supportsSectorDraftMigration(fromVersion: string, toVersion: string): boolean;
export function hasConcurrentSectorDraftEdit(input: { dirty: boolean; localUpdatedAt: number; incomingUpdatedAt: number; incomingBasedOnUpdatedAt: number }): boolean;
export function createSectorDraftRecord(input: SectorDraftRecord): SectorDraftRecord;