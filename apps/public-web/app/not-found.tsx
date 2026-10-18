import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page introuvable | Smart Solutions Tech",
  description: "Cette page de démonstration n’est pas disponible.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="not-found-page">
      <p className="feed-kicker">ERREUR 404</p>
      <h1>Cette page n’est pas disponible.</h1>
      <p>La démonstration demandée est introuvable ou n’est pas publiée.</p>
      <Link className="not-found-link" href="/">Retour aux démonstrations</Link>
    </main>
  );
}
