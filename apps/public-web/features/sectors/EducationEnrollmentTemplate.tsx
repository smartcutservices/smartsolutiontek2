"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

type Props = { mode: "desktop" | "mobile"; organizationName: string };

function SectionIcon({ kind }: { kind: "student" | "guardian" | "documents" }) {
  if (kind === "student") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2z" /></svg>;
  }
  if (kind === "guardian") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><circle cx="17.5" cy="9" r="2.5" /><path d="M2.5 21v-1.5a6.5 6.5 0 0 1 13 0V21zM16 15a5 5 0 0 1 5.5 5v1H18" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></svg>;
}

function SchoolMark() {
  return (
    <svg viewBox="0 0 40 36" aria-hidden="true">
      <path d="M20 8C14 3 7 3 2 5v22c6-2 12-1 18 4V8Zm0 0c6-5 13-5 18-3v22c-6-2-12-1-18 4V8Z" />
      <path d="M20 8v23" />
    </svg>
  );
}

export function EducationEnrollmentTemplate({ mode, organizationName }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const fieldName = event.currentTarget.name;
    const fileName = event.currentTarget.files?.[0]?.name || "";
    setFileNames((current) => ({ ...current, [fieldName]: fileName }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className={mode === "mobile" ? "mock-site mock-mobile mock-enrollment" : "mock-site mock-desktop mock-enrollment"}>
      <main className="enrollment-shell">
        {submitted ? (
          <section className="enrollment-form-card enrollment-success-state" role="status">
            <div className="enrollment-accent" />
            <span className="enrollment-success-icon" aria-hidden="true">✓</span>
            <h1>Demande simulée</h1>
            <p>Le formulaire fonctionne dans cet aperçu, mais aucune inscription n’a été envoyée ni enregistrée.</p>
            <button type="button" className="enrollment-submit" onClick={() => setSubmitted(false)}>Remplir à nouveau</button>
          </section>
        ) : (
          <form className="enrollment-form-card" onSubmit={handleSubmit}>
            <div className="enrollment-accent" />
            <header className="enrollment-form-heading">
              <div className="enrollment-brand-row">
                <span className="enrollment-mark" data-editor-image-key="school-logo" data-editor-logo="true" role="img" aria-label="Logo de l’établissement"><SchoolMark /></span>
                <span className="enrollment-school-name" data-editor-text-key="school-name">{organizationName}</span>
              </div>
              <p className="enrollment-year">2026 – 2027</p>
              <h1 data-editor-text-key="form-title">Formulaire d’inscription</h1>
              <p className="enrollment-intro" data-editor-text-key="form-intro">Veuillez remplir ce formulaire pour soumettre une demande d’inscription à {organizationName}. Tous les champs marqués d’un astérisque (*) sont obligatoires.</p>
            </header>

            <section className="enrollment-section" aria-labelledby="student-section-title">
              <header className="enrollment-section-heading">
                <span className="enrollment-section-icon"><SectionIcon kind="student" /></span>
                <h2 id="student-section-title">Informations sur l’élève</h2>
              </header>
              <div className="enrollment-field-grid">
                <label className="enrollment-field">
                  <span>Prénom <b>*</b></span>
                  <input name="studentFirstName" autoComplete="given-name" placeholder="Ex. Léa" required />
                </label>
                <label className="enrollment-field">
                  <span>Nom <b>*</b></span>
                  <input name="studentLastName" autoComplete="family-name" placeholder="Ex. Moreau" required />
                </label>
                <label className="enrollment-field">
                  <span>Date de naissance <b>*</b></span>
                  <input name="studentBirthDate" type="text" inputMode="numeric" placeholder="jj/mm/aaaa" pattern="(?:0[1-9]|[12][0-9]|3[01])/(?:0[1-9]|1[0-2])/(?:19|20)[0-9]{2}" title="Utilisez le format jour/mois/ann\u00e9e, par exemple 15/08/2015." autoComplete="bday" required />
                </label>
                <label className="enrollment-field">
                  <span>Niveau demandé <b>*</b></span>
                  <select name="requestedLevel" defaultValue="" required>
                    <option value="" disabled>Sélectionner un niveau</option>
                    <option>Préscolaire</option>
                    <option>Primaire</option>
                    <option>Secondaire I</option>
                    <option>Secondaire II</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="enrollment-section" aria-labelledby="guardian-section-title">
              <header className="enrollment-section-heading">
                <span className="enrollment-section-icon"><SectionIcon kind="guardian" /></span>
                <h2 id="guardian-section-title">Responsable légal</h2>
              </header>
              <div className="enrollment-field-grid">
                <label className="enrollment-field enrollment-field-wide">
                  <span>Nom complet <b>*</b></span>
                  <input name="guardianName" autoComplete="name" placeholder="Ex. Sophie Moreau" required />
                </label>
                <label className="enrollment-field enrollment-field-wide">
                  <span>Courriel <b>*</b></span>
                  <input name="guardianEmail" type="email" autoComplete="email" placeholder="Ex. sophie.moreau@email.fr" required />
                </label>
                <label className="enrollment-field">
                  <span>Téléphone <b>*</b></span>
                  <input name="guardianPhone" type="tel" autoComplete="tel" placeholder="Ex. +509 00 00 0000" required />
                </label>
                <label className="enrollment-field">
                  <span>Lien avec l’élève <b>*</b></span>
                  <select name="guardianRelationship" defaultValue="" required>
                    <option value="" disabled>Sélectionner un lien</option>
                    <option>Mère</option>
                    <option>Père</option>
                    <option>Tuteur ou tutrice</option>
                    <option>Autre responsable</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="enrollment-section" aria-labelledby="documents-section-title">
              <header className="enrollment-section-heading enrollment-documents-heading">
                <span className="enrollment-section-icon"><SectionIcon kind="documents" /></span>
                <div>
                  <h2 id="documents-section-title">Documents</h2>
                  <p>Vous pouvez joindre les documents suivants (PDF, JPG ou PNG).</p>
                </div>
              </header>
              <div className="enrollment-upload-list">
                <label className="enrollment-upload">
                  <span className="enrollment-upload-label">Acte de naissance <small>(optionnel)</small></span>
                  <span className="enrollment-upload-control">
                    <input type="file" name="birthCertificate" accept=".pdf,.jpg,.jpeg,.png" aria-label="Joindre l\u2019acte de naissance" onChange={handleFileChange} />
                    <span className="enrollment-file-button">Choisir un fichier</span>
                    <span className="enrollment-file-name" aria-live="polite">{fileNames.birthCertificate || "Aucun fichier choisi"}</span>
                  </span>
                </label>
                <label className="enrollment-upload">
                  <span className="enrollment-upload-label">Dernier bulletin <small>(optionnel)</small></span>
                  <span className="enrollment-upload-control">
                    <input type="file" name="schoolReport" accept=".pdf,.jpg,.jpeg,.png" aria-label="Joindre le dernier bulletin scolaire" onChange={handleFileChange} />
                    <span className="enrollment-file-button">Choisir un fichier</span>
                    <span className="enrollment-file-name" aria-live="polite">{fileNames.schoolReport || "Aucun fichier choisi"}</span>
                  </span>
                </label>
              </div>
            </section>

            <label className="enrollment-consent">
              <input type="checkbox" name="privacyConsent" required />
              <span>J’accepte que les informations de ce formulaire soient utilisées pour étudier ma demande d’inscription à {organizationName}. <b>*</b></span>
            </label>
            <p className="enrollment-demo-note">Aperçu interactif · aucune donnée n’est envoyée ni conservée.</p>
            <button type="submit" className="enrollment-submit">Envoyer ma demande <span aria-hidden="true">↗</span></button>
          </form>
        )}
      </main>
    </div>
  );
}