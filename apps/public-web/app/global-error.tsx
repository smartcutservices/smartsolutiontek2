"use client";
import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <head>
        <title>Erreur | Smart Solutions Tech</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, minHeight: "100vh", background: "#101918", color: "#f6f7f4", fontFamily: "Arial, sans-serif" }}>
        <main aria-labelledby="global-error-title" style={{ minHeight: "100vh", boxSizing: "border-box", padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <p style={{ color: "#d4e47c", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>ERREUR TECHNIQUE</p>
          <h1 id="global-error-title" style={{ maxWidth: 680, fontFamily: "Georgia, serif", fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 400 }}>Le site n’a pas pu se charger.</h1>
          <p role="alert">Réessayez ou revenez au catalogue.</p>
          <button type="button" onClick={reset} style={{ minHeight: 44, margin: 8, padding: "0 18px", border: 0, borderRadius: 999, background: "#d4e47c", color: "#1d2b25", font: "inherit", cursor: "pointer" }}>
            Réessayer
          </button>
          <Link href="/" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 16px", color: "#f6f7f4" }}>Retour au catalogue</Link>
        </main>
      </body>
    </html>
  );
}
