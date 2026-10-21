"use client";

import { useState, type FormEvent } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, signOut, type User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { getLocalFirebaseAuth, getLocalFirebaseFunctions } from "./firebase-client";

type Props = { user: User; onDeleted: (projectCount: number) => void };
type DeleteResponse = { deleted: boolean; projectCount: number };

export function AccountDeletionPanel({ user, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auth = getLocalFirebaseAuth();
    const functions = getLocalFirebaseFunctions();
    if (!auth || !functions || auth.currentUser?.uid !== user.uid) {
      setError("La session de demonstration locale n'est pas disponible.");
      return;
    }
    if (confirmation !== "SUPPRIMER MON COMPTE") {
      setError("Saisis exactement SUPPRIMER MON COMPTE pour confirmer.");
      return;
    }
    if (!user.email || !password) {
      setError("Entre le mot de passe de ce compte pour confirmer ton identité.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      const removeAccount = httpsCallable<undefined, DeleteResponse>(functions, "deleteDemoAccount");
      const result = await removeAccount(undefined);
      if (!result.data.deleted) throw new Error("ACCOUNT_DELETION_INCOMPLETE");
      await signOut(auth);
      setOpen(false);
      onDeleted(result.data.projectCount);
    } catch {
      setError("La suppression n'a pas abouti. Verifie ton mot de passe et que les emulators Firebase locaux sont demarres.");
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  return <div className="account-delete-panel">
    {!open ? <button type="button" className="account-text-button" disabled={busy} onClick={() => { setOpen(true); setError(""); }}>Supprimer mon compte de demonstration</button> : <form onSubmit={(event) => void submit(event)}>
      <p>Cette action efface le compte local, ses projets et leurs fichiers de l&apos;Emulator. Elle est definitive.</p>
      <label htmlFor="account-delete-password">Mot de passe du compte</label>
      <input id="account-delete-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.currentTarget.value)} />
      <label htmlFor="account-delete-confirmation">Saisis SUPPRIMER MON COMPTE</label>
      <input id="account-delete-confirmation" required value={confirmation} onChange={(event) => setConfirmation(event.currentTarget.value)} />
      <button className="account-primary account-delete-button" type="submit" disabled={busy || confirmation !== "SUPPRIMER MON COMPTE"}>{busy ? "Suppression..." : "Confirmer la suppression"}</button>
      <button className="account-text-button" type="button" disabled={busy} onClick={() => { setOpen(false); setPassword(""); setConfirmation(""); setError(""); }}>Annuler</button>
    </form>}
    {error && <p className="account-error" role="alert">{error}</p>}
  </div>;
}





