"use client";

import { useMemo, useState, type FormEvent } from "react";
import { getQuestionnaireProgress, reconcileQuestionnaireAnswers, validateQuestionnaireAnswers, type QuestionnaireAnswers } from "./questionnaire-engine.mjs";
import type { RegistrationField, RegistrationSiteConfigDraft } from "./registration-types";

type Props = {
  config: RegistrationSiteConfigDraft;
  answers: QuestionnaireAnswers;
  onAnswersChange: (answers: QuestionnaireAnswers) => void;
};

function displayValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  return "";
}

function QuestionInput({ field, value, invalid, onChange }: {
  field: RegistrationField;
  value: unknown;
  invalid: boolean;
  onChange: (value: unknown) => void;
}) {
  const inputId = `question-${field.id}`;
  const helpId = field.helpText ? `${inputId}-help` : undefined;
  const errorId = invalid ? `${inputId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  if (field.type === "select") {
    return <select id={inputId} required={field.required} value={displayValue(value)} aria-labelledby={`${inputId}-heading`} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)}>
      <option value="">Choisir une réponse</option>
      {field.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select>;
  }
  if (field.type === "checkbox") {
    return <label className="question-checkbox" htmlFor={inputId}>
      <input id={inputId} type="checkbox" required={field.required} checked={value === true} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={(event) => onChange(event.target.checked)} />
      <span>{field.label}</span>
    </label>;
  }
  if (field.type === "file") {
    return <p className="question-file-unavailable" role="note">Le téléversement sécurisé n’est pas encore disponible. Aucun fichier n’est envoyé ni enregistré.</p>;
  }
  const type = field.type === "email" || field.type === "tel" || field.type === "date" ? field.type : "text";
  return <input id={inputId} type={type} required={field.required} value={displayValue(value)} aria-labelledby={`${inputId}-heading`} aria-invalid={invalid || undefined} aria-describedby={describedBy} autoComplete={type === "email" ? "email" : type === "tel" ? "tel" : undefined} onChange={(event) => onChange(event.target.value)} />;
}

/** One-card-at-a-time draft UI primitive. It is not mounted by any public route. */
export function QuestionnaireCard({ config, answers, onAnswersChange }: Props) {
  const progress = useMemo(() => getQuestionnaireProgress(config, answers), [config, answers]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(progress.currentQuestionId);
  const [isReviewing, setIsReviewing] = useState(false);
  const visibleFields = config.application.fields.filter((field) => progress.visibleFieldIds.includes(field.id));
  const activeField = isReviewing ? null : visibleFields.find((field) => field.id === activeQuestionId) ?? visibleFields.find((field) => field.id === progress.currentQuestionId) ?? null;
  const activeIndex = activeField ? visibleFields.findIndex((field) => field.id === activeField.id) : -1;
  const currentError = activeField ? validateQuestionnaireAnswers(config, answers).find((error) => error.fieldId === activeField.id) : undefined;

  function updateAnswer(field: RegistrationField, value: unknown) {
    const result = reconcileQuestionnaireAnswers(config, answers, field.id, value);
    if (result.error) return;
    setIsReviewing(false);
    onAnswersChange(result.answers);
    if (!result.visibleFieldIds.includes(field.id)) setActiveQuestionId(result.currentQuestionId);
  }

  function goForward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeField || currentError) return;
    const nextField = visibleFields[activeIndex + 1];
    if (nextField) setActiveQuestionId(nextField.id);
    else setIsReviewing(true);
  }

  if (!activeField) {
    return <section className="questionnaire-card" aria-labelledby="questionnaire-complete-title">
      <p className="questionnaire-progress" role="status">Questionnaire · {progress.total} questions</p>
      <h2 id="questionnaire-complete-title">Réponses complétées</h2>
      <p>Vérifiez le récapitulatif avant de poursuivre. Rien n’a été envoyé ni enregistré.</p>
      <dl className="questionnaire-summary">{visibleFields.filter((field) => answers[field.id] !== undefined && answers[field.id] !== "").map((field) => {
        const value = field.type === "select" ? field.options.find((option) => option.id === answers[field.id])?.label ?? "Réponse à vérifier" : field.type === "file" ? "Validation serveur requise" : displayValue(answers[field.id]);
        return <div key={field.id}><dt>{field.label}</dt><dd>{value}</dd></div>;
      })}</dl>
      {visibleFields.length > 0 && <button className="questionnaire-secondary" type="button" onClick={() => { setIsReviewing(false); setActiveQuestionId(visibleFields.at(-1)?.id ?? null); }}>Modifier les réponses</button>}
    </section>;
  }

  return <section className="questionnaire-card" aria-labelledby={`question-${activeField.id}-heading`}>
    <p className="questionnaire-progress" role="status" aria-live="polite">Question {activeIndex + 1} sur {progress.total}</p>
    <div className="questionnaire-progress-track" aria-hidden="true"><span style={{ width: `${progress.total ? ((activeIndex + 1) / progress.total) * 100 : 0}%` }} /></div>
    <form onSubmit={goForward} noValidate>
      <h2 id={`question-${activeField.id}-heading`}>{activeField.label}</h2>
      {activeField.helpText && <p className="questionnaire-help" id={`question-${activeField.id}-help`}>{activeField.helpText}</p>}
      <QuestionInput field={activeField} value={answers[activeField.id]} invalid={Boolean(currentError)} onChange={(value) => updateAnswer(activeField, value)} />
      {currentError && <p className="questionnaire-error" role="alert" id={`question-${activeField.id}-error`}>{currentError.code === "required" ? "Cette réponse est obligatoire." : currentError.code === "file-validation-requires-server" ? "La validation sécurisée du fichier n’est pas disponible." : "Vérifiez cette réponse."}</p>}
      <div className="questionnaire-actions">
        {activeIndex > 0 && <button className="questionnaire-secondary" type="button" onClick={() => { setIsReviewing(false); setActiveQuestionId(visibleFields[activeIndex - 1]?.id ?? null); }}>Précédent</button>}
        <button className="questionnaire-primary" type="submit">{activeIndex === progress.total - 1 ? "Terminer" : "Continuer"}</button>
      </div>
    </form>
  </section>;
}
