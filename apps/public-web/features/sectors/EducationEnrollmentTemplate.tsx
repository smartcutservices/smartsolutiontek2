"use client";

import { useRef, useState, type FormEvent } from "react";

type Props = { mode: "desktop" | "mobile"; organizationName: string };
type Answers = Record<string, string>;

const programs = [
  { id: "primaire", title: "Primaire", range: "Du CP au CM2", detail: "Un socle solide pour grandir et apprendre avec confiance.", icon: "book" },
  { id: "college", title: "Collège", range: "De la 6e à la 3e", detail: "Développer ses talents dans un environnement exigeant et bienveillant.", icon: "school" },
  { id: "lycee", title: "Lycée", range: "De la 2de à la Terminale", detail: "Se préparer aux études supérieures et aux défis de demain.", icon: "cap" },
];

const steps = [
  { title: "Programme", detail: "Choix de la formation" },
  { title: "Élève", detail: "Informations personnelles" },
  { title: "Responsable", detail: "Coordonnées légales" },
  { title: "Documents", detail: "Pièces justificatives" },
  { title: "Vérification", detail: "Récapitulatif et envoi" },
];

function ProgramIcon({ name }: { name: string }) {
  if (name === "book") return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M14 6.5c-3.3-2.2-7-2.5-10-1v16c3-1.5 6.7-1.2 10 1m0-16c3.3-2.2 7-2.5 10-1v16c-3-1.5-6.7-1.2-10 1m0-16v16" /></svg>;
  if (name === "school") return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="m3 10 11-6 11 6M5 11h18M7 11v10m5-10v10m5-10v10m5-10v10M4 22h20M2 25h24" /></svg>;
  return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M3 11 14 5l11 6-11 6-11-6Zm4 3v6c4 3 10 3 14 0v-6M25 11v8" /></svg>;
}

export function EducationEnrollmentTemplate({ mode, organizationName }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [program, setProgram] = useState("primaire");
  const [answers, setAnswers] = useState<Answers>({ schoolYear: "2026 – 2027" });
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function captureAnswers() {
    const form = formRef.current;
    if (!form) return answers;
    const values: Answers = {};
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === "string") values[key] = value;
    }
    values.program = program;
    const next = { ...answers, ...values };
    setAnswers(next);
    return next;
  }

  function changeStep(nextStep: number) {
    captureAnswers();
    setActiveStep(Math.max(0, Math.min(steps.length - 1, nextStep)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    captureAnswers();
    if (activeStep < steps.length - 1) setActiveStep((current) => current + 1);
    else setSubmitted(true);
  }

  const selectedProgram = programs.find((item) => item.id === program) || programs[0];

  return <div className={`mock-site mock-${mode} mock-enrollment`}>
    <header className="enrollment-header">
      <a className="enrollment-brand" href="#admission-form" aria-label={organizationName}>
        <span className="enrollment-mark" data-editor-image-key="school-logo" data-editor-logo="true" aria-label="Logo de l’établissement" role="img"><svg viewBox="0 0 32 32"><path d="M16 2 19.5 11.8 30 16l-10.5 4.2L16 30l-3.5-9.8L2 16l10.5-4.2L16 2Z"/><circle cx="16" cy="16" r="3"/></svg></span>
        <span>{organizationName}</span>
      </a>
      <span className="enrollment-header-title">Admissions 2026 – 2027</span>
      <a className="enrollment-help-link" href="#enrollment-help"><span aria-hidden="true">?</span> Aide</a>
    </header>

    <main className="enrollment-layout" id="admission-form">
      <aside className="enrollment-sidebar" aria-label="Étapes du dossier">
        <p className="enrollment-sidebar-title">Admissions<br/>2026 – 2027</p>
        <ol className="enrollment-step-list">
          {steps.map((step, index) => <li key={step.title} className={index === activeStep ? "is-active" : index < activeStep ? "is-complete" : ""}>
            <button type="button" onClick={() => index <= activeStep && changeStep(index)} aria-current={index === activeStep ? "step" : undefined} disabled={index > activeStep}>
              <span className="enrollment-step-number">{index < activeStep ? "?" : index + 1}</span>
              <span><b>{step.title}</b><small>{step.detail}</small></span>
            </button>
          </li>)}
        </ol>
        <aside className="enrollment-help-card" id="enrollment-help"><span aria-hidden="true">?</span><div><b>Une question ?</b><p>Notre équipe vous accompagne dans votre démarche.</p><a href="mailto:admissions@instituthorizon.example">Consulter la FAQ <span aria-hidden="true">?</span></a></div></aside>
      </aside>

      <form className="enrollment-form-card" ref={formRef} onSubmit={handleSubmit}>
        <div className="enrollment-progress-row"><span>Étape {activeStep + 1} sur {steps.length}</span><span>{Math.round(((activeStep + 1) / steps.length) * 100)} % complété</span></div>
        <div className="enrollment-progress-track" aria-hidden="true"><span style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}/></div>
        {!submitted ? <>
          <div className="enrollment-form-heading"><h2>{activeStep === 4 ? "Vérifiez votre dossier" : activeStep === 0 ? "Commencez votre dossier" : steps[activeStep].title === "Élève" ? "Parlons de votre enfant" : activeStep === 2 ? "Qui est son responsable ?" : activeStep === 3 ? "Préparez les documents" : "Complétez les informations"}</h2><p>{activeStep === 0 ? "Sélectionnez la formation souhaitée et renseignez les premières informations sur l’élève. Vous pourrez compléter votre dossier à votre rythme." : activeStep === 4 ? "Prenez un instant pour vérifier les informations avant de terminer." : "Les champs marqués d’un astérisque sont nécessaires pour préparer le dossier."}</p></div>

          <fieldset className="enrollment-step-content" hidden={activeStep !== 0} disabled={activeStep !== 0}>
            <legend>Programme et première information</legend>
            <div className="enrollment-section-label"><b>Formation souhaitée <span aria-hidden="true">*</span></b><small>Choisissez le programme pour lequel vous souhaitez inscrire votre enfant.</small></div>
            <div className="enrollment-program-grid">
              {programs.map((item) => <label key={item.id} className={program === item.id ? "enrollment-program is-selected" : "enrollment-program"}>
                <input type="radio" name="program" value={item.id} checked={program === item.id} onChange={() => setProgram(item.id)} required/>
                <span className="enrollment-radio" aria-hidden="true"/>
                <ProgramIcon name={item.icon}/>
                <span className="enrollment-program-copy"><b>{item.title}</b><small>{item.range}</small><span>{item.detail}</span></span>
              </label>)}
            </div>
            <div className="enrollment-divider"/>
            <div className="enrollment-section-label"><b>Informations sur l’élève</b><small>Les informations doivent correspondre aux documents officiels.</small></div>
            <div className="enrollment-field-grid">
              <label className="enrollment-field"><span>Prénom de l’élève <b>*</b></span><input name="studentFirstName" autoComplete="given-name" placeholder="Ex. Jules" defaultValue={answers.studentFirstName || ""} onChange={() => captureAnswers()} required/></label>
              <label className="enrollment-field"><span>Nom de l’élève <b>*</b></span><input name="studentLastName" autoComplete="family-name" placeholder="Ex. Martin" defaultValue={answers.studentLastName || ""} onChange={() => captureAnswers()} required/></label>
              <label className="enrollment-field"><span>Adresse e-mail <b>*</b></span><input name="studentEmail" type="email" autoComplete="email" placeholder="Ex. jules.martin@email.fr" defaultValue={answers.studentEmail || ""} onChange={() => captureAnswers()} required/><small>Cette adresse servira au suivi du dossier.</small></label>
              <label className="enrollment-field"><span>Année scolaire souhaitée <b>*</b></span><input name="schoolYear" placeholder="2026 – 2027" defaultValue={answers.schoolYear || "2026 – 2027"} onChange={() => captureAnswers()} required/></label>
            </div>
            <label className="enrollment-consent"><input type="checkbox" name="privacyConsent" required/><span>J’accepte que les informations renseignées dans ce formulaire soient utilisées dans le cadre du traitement de ma demande d’inscription, conformément à notre <a href="#privacy">Politique de confidentialité</a>.</span></label>
          </fieldset>

          <fieldset className="enrollment-step-content" hidden={activeStep !== 1} disabled={activeStep !== 1}>
            <legend>Informations personnelles de l’élève</legend>
            <div className="enrollment-section-label"><b>État civil</b><small>Ces informations permettent d’identifier le bon dossier.</small></div>
            <div className="enrollment-field-grid">
              <label className="enrollment-field"><span>Date de naissance <b>*</b></span><input name="studentBirthDate" type="date" defaultValue={answers.studentBirthDate || ""} onChange={() => captureAnswers()} required/></label>
              <label className="enrollment-field"><span>Nationalité</span><input name="studentNationality" placeholder="Ex. Haïtienne" defaultValue={answers.studentNationality || ""} onChange={() => captureAnswers()}/></label>
              <label className="enrollment-field enrollment-field-wide"><span>Adresse de résidence <b>*</b></span><input name="studentAddress" autoComplete="street-address" placeholder="Numéro et nom de rue" defaultValue={answers.studentAddress || ""} onChange={() => captureAnswers()} required/></label>
              <label className="enrollment-field"><span>Ville <b>*</b></span><input name="studentCity" autoComplete="address-level2" placeholder="Ex. Port-au-Prince" defaultValue={answers.studentCity || ""} onChange={() => captureAnswers()} required/></label>
              <label className="enrollment-field"><span>Code postal</span><input name="studentPostalCode" autoComplete="postal-code" placeholder="Code postal" defaultValue={answers.studentPostalCode || ""} onChange={() => captureAnswers()}/></label>
            </div>
          </fieldset>

          <fieldset className="enrollment-step-content" hidden={activeStep !== 2} disabled={activeStep !== 2}>
            <legend>Coordonnées du responsable légal</legend>
            <div className="enrollment-section-label"><b>Responsable de l’élève</b><small>La personne à contacter pour le suivi de la candidature.</small></div>
            <div className="enrollment-field-grid">
              <label className="enrollment-field"><span>Prénom du responsable <b>*</b></span><input name="guardianFirstName" autoComplete="given-name" placeholder="Prénom" defaultValue={answers.guardianFirstName || ""} onChange={() => captureAnswers()} required/></label>
              <label className="enrollment-field"><span>Nom du responsable <b>*</b></span><input name="guardianLastName" autoComplete="family-name" placeholder="Nom" defaultValue={answers.guardianLastName || ""} onChange={() => captureAnswers()} required/></label>
              <label className="enrollment-field"><span>Courriel du responsable <b>*</b></span><input name="guardianEmail" type="email" autoComplete="email" placeholder="nom@exemple.com" defaultValue={answers.guardianEmail || ""} onChange={() => captureAnswers()} required/></label>
              <label className="enrollment-field"><span>Téléphone <b>*</b></span><input name="guardianPhone" type="tel" autoComplete="tel" placeholder="+509 00 00 0000" defaultValue={answers.guardianPhone || ""} onChange={() => captureAnswers()} required/></label>
              <label className="enrollment-field enrollment-field-wide"><span>Lien avec l’élève <b>*</b></span><input name="guardianRelationship" placeholder="Ex. Mère, père, tuteur" defaultValue={answers.guardianRelationship || ""} onChange={() => captureAnswers()} required/></label>
            </div>
          </fieldset>

          <fieldset className="enrollment-step-content" hidden={activeStep !== 3} disabled={activeStep !== 3}>
            <legend>Pièces justificatives</legend>
            <div className="enrollment-section-label"><b>Documents du dossier</b><small>Formats acceptés : PDF, JPG et PNG. Les fichiers restent sur cet appareil dans cette démo.</small></div>
            <div className="enrollment-upload-list">
              {[{ id: "birthCertificate", title: "Acte de naissance", help: "Copie lisible du document officiel" }, { id: "schoolReport", title: "Dernier bulletin scolaire", help: "Bulletin le plus récent disponible" }, { id: "photoId", title: "Photo de l’élève", help: "Portrait récent, format JPG ou PNG" }].map((item) => <label className="enrollment-upload" key={item.id}>
                <span className="enrollment-upload-icon" aria-hidden="true">?</span><span className="enrollment-upload-copy"><b>{item.title}</b><small>{item.help}</small><em>{fileNames.find((name) => name.startsWith(`${item.id}:`))?.split(":").slice(1).join(":") || "Aucun fichier sélectionné"}</em></span>
                <input type="file" name={item.id} accept="application/pdf,image/jpeg,image/png" onChange={(event) => setFileNames((current) => [...current.filter((name) => !name.startsWith(`${item.id}:`)), ...(event.currentTarget.files?.[0] ? [`${item.id}:${event.currentTarget.files[0].name}`] : [])])}/>
              </label>)}
            </div>
            <p className="enrollment-privacy-note">Cette maquette ne téléverse aucun document et ne transmet aucune donnée.</p>
          </fieldset>

          <fieldset className="enrollment-step-content" hidden={activeStep !== 4} disabled={activeStep !== 4}>
            <legend>Récapitulatif de la candidature</legend>
            <div className="enrollment-section-label"><b>Vérifiez les informations</b><small>Vous pourrez revenir en arrière avant tout envoi.</small></div>
            <dl className="enrollment-review-list">
              <div><dt>Programme</dt><dd>{selectedProgram.title} · {selectedProgram.range}</dd></div>
              <div><dt>Élève</dt><dd>{[answers.studentFirstName, answers.studentLastName].filter(Boolean).join(" ") || "À compléter"}</dd></div>
              <div><dt>Courriel</dt><dd>{answers.studentEmail || "À compléter"}</dd></div>
              <div><dt>Année scolaire</dt><dd>{answers.schoolYear || "2026 – 2027"}</dd></div>
              <div><dt>Responsable</dt><dd>{[answers.guardianFirstName, answers.guardianLastName].filter(Boolean).join(" ") || "À compléter"}</dd></div>
              <div><dt>Documents</dt><dd>{fileNames.length} fichier(s) sélectionné(s)</dd></div>
            </dl>
            <p className="enrollment-privacy-note">En environnement réel, la candidature serait transmise uniquement après validation de la politique de confidentialité et du stockage sécurisé.</p>
          </fieldset>

          {submitted && <div className="enrollment-submission-success" role="status"><span aria-hidden="true">?</span><div><b>Votre dossier de démonstration est prêt</b><p>Aucune candidature n’a été transmise. Le formulaire présente seulement le parcours attendu.</p></div></div>}
          <div className="enrollment-form-actions">
            {activeStep > 0 && !submitted && <button type="button" className="enrollment-back-button" onClick={() => changeStep(activeStep - 1)}>Précédent</button>}
            {!submitted && <button type="submit" className="enrollment-continue-button">{activeStep === steps.length - 1 ? "Terminer le dossier" : "Continuer"}<span aria-hidden="true">?</span></button>}
          </div>
          <p className="enrollment-demo-note"><span aria-hidden="true">?</span> Démonstration locale · aucune information ne sera transmise</p>
        </> : <div className="enrollment-success-view"><span aria-hidden="true">?</span><h2>Dossier préparé</h2><p>Cette démonstration ne transmet et ne conserve aucune candidature.</p><button type="button" className="enrollment-continue-button" onClick={() => { setSubmitted(false); setActiveStep(0); }}>Recommencer</button></div>}
      </form>
    </main>
  </div>;
}


