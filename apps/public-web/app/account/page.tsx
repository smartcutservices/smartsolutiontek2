import type { Metadata } from "next";
import Link from "next/link";
import { AccountPanel } from "../../features/auth/AccountPanel";

export const metadata: Metadata = {
  title: "Compte local | Smart Solutions Tech",
  description: "Espace de compte de développement Smart Solutions Tech.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <main className="account-page">
    <header><Link href="/" className="account-back">← Retour au feed</Link><span>SMART SOLUTIONS TECH</span></header>
    <section className="account-content">
      <p className="account-eyebrow">COMPTE DE DÉVELOPPEMENT</p>
      <h1>Vos projets, au même endroit.</h1>
      <p className="account-lead">Le compte est isolé dans l’émulateur Firebase local pendant la construction du produit.</p>
      <AccountPanel />
    </section>
  </main>;
}
