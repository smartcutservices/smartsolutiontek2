import type { QuestionnaireAnswers } from "./schema.mjs";

export type QuestionnaireMigrationOperation =
  | { type: "renameQuestion"; fromId: string; toId: string }
  | { type: "dropAnswer"; questionId: string; reason: string }
  | { type: "mapOption"; questionId: string; mapping: Record<string, string> };
export type QuestionnaireMigration = {
  id: string;
  schemaId: string;
  fromVersion: string;
  toVersion: string;
  operations: QuestionnaireMigrationOperation[];
};
export type QuestionnaireMigrationResult =
  | { ok: true; schemaId: string; fromVersion: string; toVersion: string; answers: QuestionnaireAnswers; orphanedAnswers: Record<string, { value: unknown; reason: string; migrationId: string }>; appliedMigrationIds: string[] }
  | { ok: false; code: string; answers: QuestionnaireAnswers; orphanedAnswers: Record<string, never>; appliedMigrationIds: string[] };
export type QuestionnaireMigrationPreview = {
  ok: boolean;
  status: "ready-for-review" | "needs-attention";
  requiresHumanApproval: true;
  schemaId?: string;
  fromVersion?: string;
  toVersion?: string;
  code?: string;
  schemaErrors: string[];
  answerErrors: Array<{ questionId: string | null; code: string }>;
  answers: QuestionnaireAnswers;
  orphanedAnswers: Record<string, { value: unknown; reason: string; migrationId: string }>;
  appliedMigrationIds: string[];
};
export type QuestionnaireMigrationReviewResult =
  | { ok: true; status: "review-approved"; schemaId: string; fromVersion: string; toVersion: string; activeAnswers: QuestionnaireAnswers; retainedOrphanedAnswers: Record<string, { value: unknown; reason: string; migrationId: string }>; discardedOrphanIds: string[]; appliedMigrationIds: string[]; approved: true }
  | { ok: false; code: string; answerErrors: Array<{ questionId: string | null; code: string }>; unresolvedOrphanIds: string[]; unknownDecisionIds?: string[]; retainedOrphanedAnswers?: Record<string, { value: unknown; reason: string; migrationId: string }>; discardedOrphanIds?: string[] };

export function validateQuestionnaireMigrations(migrations: unknown): string[];
export function migrateQuestionnaireAnswers(input: {
  schemaId: string;
  fromVersion: string;
  toVersion: string;
  answers: QuestionnaireAnswers;
  migrations: QuestionnaireMigration[];
}): QuestionnaireMigrationResult;
export function previewQuestionnaireMigration(input: {
  schemaId: string;
  fromVersion: string;
  targetSchema: import("./schema.mjs").QuestionnaireSchema;
  answers: QuestionnaireAnswers;
  migrations: QuestionnaireMigration[];
}): QuestionnaireMigrationPreview;
export function resolveQuestionnaireMigrationReview(input: {
  preview: QuestionnaireMigrationPreview;
  targetSchema: import("./schema.mjs").QuestionnaireSchema;
  approved: boolean;
  orphanDecisions?: Record<string, "retain" | "discard">;
  correctedAnswers?: QuestionnaireAnswers;
}): QuestionnaireMigrationReviewResult;
