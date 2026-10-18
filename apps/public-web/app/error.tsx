"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="runtime-error-page" aria-labelledby="runtime-error-title">
      <p className="feed-kicker">UNE ERREUR EST SURVENUE</p>
      <h1 id="runtime-error-title">La page n’a pas pu se charger.</h1>
      <p role="alert">Réessayez. Si le problème continue, revenez au catalogue.</p>
      <div className="runtime-error-actions">
        <button type="button" className="runtime-error-retry" onClick={reset}>Réessayer</button>
        <Link className="runtime-error-home" href="/">Retour au catalogue</Link>
      </div>
    </main>
  );
}
