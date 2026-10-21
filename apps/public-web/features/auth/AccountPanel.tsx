"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getLocalFirebaseAuth } from "./firebase-client";
import { AccountDeletionPanel } from "./AccountDeletionPanel";

type FormMode = "sign-in" | "sign-up" | "reset";

function friendlyAuthError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code.endsWith("/email-already-in-use")) return "Cette adresse e-mail possède déjà un compte.";
  if (code.endsWith("/invalid-email")) return "Vérifie le format de l’adresse e-mail.";
  if (code.endsWith("/weak-password")) return "Choisis un mot de passe d’au moins 6 caractères.";
  if (code.endsWith("/invalid-credential") || code.endsWith("/user-not-found") || code.endsWith("/wrong-password")) return "Adresse e-mail ou mot de passe incorrect.";
  if (code.endsWith("/too-many-requests")) return "Trop de tentatives. Réessaie dans quelques minutes.";
  return "La demande n’a pas abouti. Vérifie que l’émulateur local est démarré et réessaie.";
}

export function AccountPanel() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<FormMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function returnToTemplateEditor() {
    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    if (returnTo?.startsWith("/templates/") && !returnTo.startsWith("//")) window.location.assign(returnTo);
  }

  useEffect(() => {
    const auth = getLocalFirebaseAuth();
    if (!auth) {
      const frame = requestAnimationFrame(() => setAuthReady(true));
      return () => cancelAnimationFrame(frame);
    }
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    }, () => {
      setError("La session locale n’a pas pu être vérifiée.");
      setAuthReady(true);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auth = getLocalFirebaseAuth();
    if (!auth) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      if (mode === "sign-up") {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(credential.user);
        setStatus("Compte local créé. L’émulateur a préparé un e-mail de vérification.");
        returnToTemplateEditor();
      } else if (mode === "reset") {
        await sendPasswordResetEmail(auth, email.trim());
        setStatus("Si le compte existe, l’émulateur a préparé un lien de réinitialisation.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setStatus("Connexion locale réussie.");
        returnToTemplateEditor();
      }
    } catch (cause) {
      setError(friendlyAuthError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    if (!user) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await sendEmailVerification(user);
      setStatus("L’émulateur a préparé un nouvel e-mail de vérification.");
    } catch (cause) {
      setError(friendlyAuthError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function leaveAccount() {
    const auth = getLocalFirebaseAuth();
    if (!auth) return;
    setBusy(true);
    setError("");
    try {
      await signOut(auth);
      setStatus("Déconnexion réussie.");
    } catch (cause) {
      setError(friendlyAuthError(cause));
    } finally {
      setBusy(false);
    }
  }

  return <section className="account-panel" aria-label="Compte Smart Solutions Tech">
    {!authReady ? <p role="status">Chargement du compte local…</p> : !getLocalFirebaseAuth() ? <div className="account-disabled" role="status">
      <b>Le compte local n’est pas encore démarré.</b>
      <p>Cette page se connecte uniquement à l’émulateur Firebase local `demo-smartsolutiontek` sur le port 9099. Aucun compte réel ni compte SmartCut ne sera contacté.</p>
      <code>npm run emulators:auth</code>
    </div> : user ? <div className="account-signed-in" data-account-uid={user.uid}>
      <p className="account-eyebrow">SESSION LOCALE</p>
      <h2>Bonjour</h2>
      <p className="account-email">{user.email}</p>
      <p>{user.emailVerified ? "Adresse vérifiée dans l’émulateur." : "Adresse à vérifier dans la boîte de réception de l’émulateur."}</p>
      {!user.emailVerified && <button type="button" className="account-secondary" disabled={busy} onClick={() => void resendVerification()}>Préparer un e-mail de vérification</button>}
      <button type="button" className="account-primary" disabled={busy} onClick={() => void leaveAccount()}>Se déconnecter</button><AccountDeletionPanel user={user} onDeleted={(count) => setStatus(`Suppression terminée : compte et projets associés supprimés (${count}) dans l’émulateur local.`)} />
    </div> : <>
      <div className="account-tabs" role="group" aria-label="Type de demande">
        <button type="button" aria-pressed={mode === "sign-in"} onClick={() => { setMode("sign-in"); setError(""); setStatus(""); }}>Connexion</button>
        <button type="button" aria-pressed={mode === "sign-up"} onClick={() => { setMode("sign-up"); setError(""); setStatus(""); }}>Créer un compte</button>
      </div>
      <h2>{mode === "reset" ? "Réinitialiser le mot de passe" : mode === "sign-up" ? "Créer votre compte" : "Retrouver vos projets"}</h2>
      <p>{mode === "reset" ? "Un lien sera préparé dans l’émulateur local." : "Utilisez un compte de test stocké uniquement dans Firebase Emulator."}</p>
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="account-email">Adresse e-mail</label>
        <input id="account-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
        {mode !== "reset" && <>
          <label htmlFor="account-password">Mot de passe</label>
          <input id="account-password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.currentTarget.value)} />
        </>}
        <button className="account-primary" type="submit" disabled={busy}>{busy ? "Patientez…" : mode === "reset" ? "Préparer la réinitialisation" : mode === "sign-up" ? "Créer le compte local" : "Se connecter"}</button>
      </form>
      {mode === "sign-in" && <button className="account-text-button" type="button" onClick={() => { setMode("reset"); setError(""); setStatus(""); }}>Mot de passe oublié ?</button>}
      {mode === "reset" && <button className="account-text-button" type="button" onClick={() => { setMode("sign-in"); setError(""); setStatus(""); }}>Retour à la connexion</button>}
    </>}
    {status && <p className="account-status" role="status">{status}</p>}
    {error && <p className="account-error" role="alert">{error}</p>}
  </section>;
}


