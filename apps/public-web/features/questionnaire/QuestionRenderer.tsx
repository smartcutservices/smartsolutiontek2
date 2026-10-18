import type { ChangeEvent } from "react";
import type { QuestionnaireQuestion } from "./schema.mjs";

type Props = {
  question: QuestionnaireQuestion;
  value: unknown;
  required: boolean;
  describedBy?: string;
  invalid?: boolean;
  onChange: (value: unknown) => void;
};

const addressFields = [
  ["line1", "Adresse"], ["line2", "Complément d’adresse"], ["district", "Quartier"],
  ["city", "Ville"], ["region", "Département ou région"], ["postalCode", "Code postal"], ["countryCode", "Code pays (ISO 2 lettres)"],
] as const;

function optionLabel(question: QuestionnaireQuestion, id: string) {
  return question.options?.find((option) => option.id === id)?.label ?? id;
}

export function QuestionRenderer({ question, value, required, describedBy, invalid = false, onChange }: Props) {
  const id = `answer-${question.id}`;
  const text = typeof value === "string" ? value : "";
  const bounds = question.validation ?? {};
  const accessibleState = { "aria-describedby": describedBy, "aria-invalid": invalid || undefined };

  if (question.type === "shortText" || question.type === "longText" || question.type === "email" || question.type === "phone") {
    const common = { ...accessibleState, id, required, "aria-required": required, "aria-labelledby": `q-${question.id}`, maxLength: bounds.maxLength, value: text, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value) };
    return <div className="question-field">{question.type === "longText" ? <textarea {...common} minLength={bounds.minLength} rows={5} /> : <input {...common} type={question.type === "email" ? "email" : question.type === "phone" ? "tel" : "text"} minLength={bounds.minLength} />}</div>;
  }

  if (question.type === "number") return <input {...accessibleState} id={id} type="number" required={required} aria-required={required} aria-labelledby={`q-${question.id}`} min={bounds.min} max={bounds.max} step="any" value={typeof value === "number" || typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value === "" ? "" : event.currentTarget.valueAsNumber)} />;

  if (question.type === "amount") {
    const amount = typeof value === "object" && value !== null && !Array.isArray(value) ? value as { value?: unknown; currency?: unknown } : {};
    return <div className="question-composite"><label htmlFor={`${id}-value`}>Montant</label><input {...accessibleState} id={`${id}-value`} type="text" inputMode="decimal" required={required} aria-required={required} maxLength={32} value={typeof amount.value === "string" ? amount.value : ""} onChange={(event) => { const next = event.target.value; onChange(next === "" ? "" : { value: next, currency: typeof amount.currency === "string" ? amount.currency : "HTG" }); }} /><label htmlFor={`${id}-currency`}>Devise (code ISO à 3 lettres)</label><input {...accessibleState} id={`${id}-currency`} type="text" inputMode="text" autoCapitalize="characters" maxLength={3} required={required} aria-required={required} value={typeof amount.currency === "string" ? amount.currency : "HTG"} onChange={(event) => onChange(typeof amount.value === "string" && amount.value.length > 0 ? { value: amount.value, currency: event.target.value.toUpperCase() } : "")} /></div>;
  }

  if (question.type === "yesNo" || question.type === "singleChoice" || question.type === "font" || question.type === "geographicArea" || question.type === "sectionChoice") {
    const choices = question.type === "yesNo" ? [{ id: "yes", label: "Oui", value: true }, { id: "no", label: "Non", value: false }] : (question.options ?? []).map((option) => ({ ...option, value: option.id }));
    const selected = question.type === "yesNo" ? (value === true ? "yes" : value === false ? "no" : "") : text;
    return <div className="sector-options" role="radiogroup" aria-labelledby={`q-${question.id}`} {...accessibleState}>{choices.map((choice) => <label key={choice.id} className={selected === choice.id ? "selected" : ""}><input type="radio" name={question.id} value={choice.id} required={required} checked={selected === choice.id} onChange={() => onChange(choice.value)} /><span>{choice.label}</span></label>)}</div>;
  }

  if (question.type === "multipleChoice") {
    const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    const isSectionSelection = question.id === "included-sections";
    const sectionDescriptions: Record<string, string> = {
      overview: "Présenter votre projet et les informations essentielles.",
      services: "Décrire vos offres, activités ou prestations.",
      gallery: "Montrer vos réalisations, lieux ou produits.",
      testimonials: "Partager des avis authentiques et des références.",
      contact: "Indiquer les moyens de contact et les prochaines étapes.",
      payments: "Présenter un parcours envisagé; aucun paiement ne sera activé ici.",
    };
    return <fieldset className={isSectionSelection ? "question-list question-section-grid" : "question-list"} aria-required={required} {...accessibleState}><legend className="sr-only">{question.label}</legend>{question.options?.map((option) => { const isSelected = selected.includes(option.id); return <label key={option.id} className={isSectionSelection ? (isSelected ? "question-section-card is-selected" : "question-section-card") : undefined}><input type="checkbox" checked={isSelected} onChange={(event) => onChange(event.target.checked ? [...selected, option.id] : selected.filter((item) => item !== option.id))} /><span>{option.label}</span>{isSectionSelection ? <small>{sectionDescriptions[option.id] ?? "Ajouter cette section à l’aperçu local."}</small> : null}</label>; })}</fieldset>;
  }

  if (question.type === "date") return <input {...accessibleState} id={id} type="date" required={required} aria-required={required} aria-labelledby={`q-${question.id}`} value={text} onChange={(event) => onChange(event.target.value)} />;
  if (question.type === "dateTime") {
    const localValue = text ? (() => { const date = new Date(text); return Number.isNaN(date.valueOf()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })() : "";
    return <input {...accessibleState} id={id} type="datetime-local" required={required} aria-required={required} aria-labelledby={`q-${question.id}`} value={localValue} onChange={(event) => onChange(event.target.value ? new Date(event.target.value).toISOString() : "")} />;
  }
  if (question.type === "color") return <div className="question-color" {...accessibleState}><input id={id} type="color" aria-labelledby={`q-${question.id}`} value={/^#(?:[0-9a-f]{6})$/i.test(text) ? text : "#3157d5"} onChange={(event) => onChange(event.target.value)} /><input aria-label="Code hexadécimal de la couleur (opaque, #RGB ou #RRGGBB)" value={text} maxLength={7} onChange={(event) => onChange(event.target.value)} /></div>;

  if (question.type === "address") {
    const address = typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
    return <div className="question-address" role="group" aria-label={question.label} {...accessibleState}>{addressFields.map(([key, label]) => <label key={key} htmlFor={`${id}-${key}`}>{label}<input id={`${id}-${key}`} autoComplete={key === "line1" ? "address-line1" : key === "line2" ? "address-line2" : key === "city" ? "address-level2" : key === "district" ? "address-level3" : key === "postalCode" ? "postal-code" : key === "countryCode" ? "off" : "address-level1"} maxLength={key === "countryCode" ? 2 : 160} value={typeof address[key] === "string" ? address[key] as string : ""} onChange={(event) => onChange({ ...address, [key]: key === "countryCode" ? event.target.value.toUpperCase() : event.target.value })} /></label>)}</div>;
  }

  if (question.type === "repeatableList") {
    const items = Array.isArray(value) ? value.map((item) => typeof item === "object" && item !== null && !Array.isArray(item) && typeof item.value === "string" ? item.value : "") : [];
    const setItems = (next: string[]) => onChange(next.length ? next.map((item) => ({ value: item })) : "");
    return <div className="question-repeatable" role="group" aria-label={question.label} {...accessibleState}>{items.map((item, index) => <div key={`${question.id}-${index}`}><label htmlFor={`${id}-${index}`}>Élément {index + 1}</label><input id={`${id}-${index}`} value={item} maxLength={bounds.maxLength ?? 200} aria-invalid={invalid || undefined} onChange={(event) => setItems(items.map((entry, itemIndex) => itemIndex === index ? event.target.value : entry))} /><button type="button" className="sector-back" onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}>Retirer</button></div>)}<button type="button" className="sector-back" disabled={bounds.maxItems !== undefined && items.length >= bounds.maxItems} onClick={() => setItems([...items, ""])}>Ajouter un élément</button></div>;
  }

  if (question.type === "order") {
    const options = question.options ?? [];
    const stored = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && options.some((option) => option.id === item)) : [];
    const selected = [...stored, ...options.map((option) => option.id).filter((optionId) => !stored.includes(optionId))];
    const move = (index: number, delta: number) => { const next = [...selected]; const target = index + delta; if (target < 0 || target >= next.length) return selected; [next[index], next[target]] = [next[target], next[index]]; return next; };
    return <div role="group" aria-label={question.label} {...accessibleState}><ol className="question-order">{selected.map((optionId, index) => <li key={optionId}><span>{optionLabel(question, optionId)}</span><button type="button" aria-label={`Monter ${optionLabel(question, optionId)}`} disabled={index === 0} onClick={() => onChange(move(index, -1))}>↑</button><button type="button" aria-label={`Descendre ${optionLabel(question, optionId)}`} disabled={index === selected.length - 1} onClick={() => onChange(move(index, 1))}>↓</button></li>)}</ol><button type="button" className="sector-back" onClick={() => onChange(selected)}>Confirmer cet ordre</button></div>;
  }

  if (question.type === "file" || question.type === "image" || question.type === "logo") return <div className="question-upload-unavailable" role="note"><p>Le téléversement sécurisé n’est pas encore connecté. Aucun fichier n’est chargé ni conservé dans ce brouillon local.</p></div>;

  return <p className="sector-error" role="alert">Ce type de question n’est pas pris en charge dans cette version.</p>;
}
