"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";

type TemplateImage = {
  id: string;
  name: string;
  sector: string;
  image: string;
  width: number;
  height: number;
  alt: string;
};

const templateImages: TemplateImage[] = [
  { id: "education", name: "Institut Horizon", sector: "Inscription en ligne · Éducation", image: "/media/references/school-enrollment-form-reference-v2.png", width: 948, height: 1659, alt: "Formulaire d’inscription scolaire en ligne, avec les informations de l’élève et du responsable." },
  { id: "training", name: "L’Atelier des savoirs", sector: "Formations et cours", image: "/media/references/training-enrollment-reference-v1.png", width: 946, height: 1652, alt: "Site de formation avec parcours, accompagnement et demande d’inscription." },
  { id: "single-product", name: "Atelier Ocre", sector: "Commerce mono-produit", image: "/media/references/single-product-reference-v1.png", width: 801, height: 1962, alt: "Page produit pour un sac artisanal en cuir cognac." },
  { id: "multi-product", name: "Maison Sable", sector: "Commerce multi-produits", image: "/media/references/multi-product-reference-v1.png", width: 919, height: 1711, alt: "Boutique artisanale de maison avec collections et sélection de produits." },
  { id: "restaurant", name: "Lakou", sector: "Restaurants et restauration rapide", image: "/media/references/restaurant-reference-v1.png", width: 789, height: 1993, alt: "Site de bistro haïtien avec menu illustré, histoire et informations pratiques." },
  { id: "catering", name: "Maison Safran", sector: "Pâtisserie, cuisine et traiteur", image: "/media/references/catering-reference-v1.png", width: 809, height: 1944, alt: "Site de pâtisserie et réception avec créations, gâteaux et buffet élégant." },
  { id: "service-booking", name: "Serein Studio", sector: "Réservation de services", image: "/media/references/service-booking-reference-v1.png", width: 803, height: 1958, alt: "Studio de bien-être avec soins, massages et informations de prise de rendez-vous." },
  { id: "beauty", name: "Maison Néroli", sector: "Salons de beauté, coiffure et spa", image: "/media/references/beauty-reference-v1.png", width: 941, height: 1672, alt: "Site de salon de beauté avec coiffure, soins du visage, manucure et informations pratiques." },
  { id: "portfolio", name: "Atelier Solenne", sector: "Portfolios et cr\u00e9ateurs", image: "/media/references/portfolio-reference-v1.webp", width: 956, height: 1646, alt: "Portfolio cr\u00e9atif avec portrait, projets d'objets, photographie et r\u00e9cits visuels." },
  { id: "agency", name: "LIGNE 09", sector: "Entreprises et agences", image: "/media/references/agency-reference-v1.webp", width: 951, height: 1653, alt: "Site de studio de marque avec identité visuelle, photographie et projets de campagne." },
  { id: "craftspeople", name: "Atelier Tiko", sector: "Artisans et m\u00e9tiers", image: "/media/references/craftspeople-reference-v1.webp", width: 951, height: 1653, alt: "Site d’artisan du bois avec mobilier sur mesure, atelier et r\u00e9alisations." },
  { id: "real-estate", name: "HABITAT NOU", sector: "Immobilier", image: "/media/references/real-estate-reference-v1.webp", width: 940, height: 1672, alt: "Référence visuelle immobilière avec annonces, prix et adresses à confirmer." },
  { id: "hospitality", name: "MAISON CORAIL", sector: "Hôtels et hébergements", image: "/media/references/hospitality-reference-v1.webp", width: 941, height: 1672, alt: "Référence visuelle d’un hébergement côtier; adresse, tarifs et disponibilité à confirmer." },
  { id: "tourism", name: "LAKOU ESCAPADES", sector: "Tourisme et excursions", image: "/media/references/tourism-reference-v1.webp", width: 941, height: 1672, alt: "Référence visuelle de circuits touristiques en Haïti; parcours, horaires et prix à confirmer." },
  { id: "vehicles", name: "ROUTE NOIRE", sector: "Automobile et motos", image: "/media/references/vehicles-reference-v1.webp", width: 941, height: 1672, alt: "Référence visuelle d’un catalogue automobile; prix, état et disponibilité à confirmer." },
  { id: "ticketing", name: "NOUVEL VAG", sector: "Billetterie", image: "/media/references/ticketing-reference-v1.webp", width: 941, height: 1672, alt: "Référence visuelle de festival haïtien avec programme et billetterie non ouverte." },
  { id: "events", name: "Rasin & Rythmes", sector: "\u00c9v\u00e9nements", image: "/media/references/events-reference-v1.webp", width: 951, height: 1653, alt: "Festival culturel avec musique, arts visuels et participation communautaire." },
];

function FeedIcon({ name }: { name: "like" | "comment" | "share" | "customize" }) {
  const paths = {
    like: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    comment: <><path d="M21 11.5a8.4 8.4 0 0 1-9 8.3 9 9 0 0 1-4-.9L3 21l1.5-4.5a8 8 0 1 1 16.5-5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></>,
    share: <><path d="M12 16V3m0 0L7 8m5-5 5 5" /><path d="M5 13v7h14v-7" /></>,
    customize: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="11" cy="18" r="2" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function TemplateSlide({ template, first }: { template: TemplateImage; first: boolean }) {
  const [liked, setLiked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [shareStatus, setShareStatus] = useState("");

  async function shareTemplate() {
    const url = `${window.location.origin}/templates/${template.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: template.name, text: `Découvrir le modèle ${template.name}`, url });
        setShareStatus("Lien partagé.");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareStatus("Lien copié.");
    } catch {
      setShareStatus("Le partage n’a pas abouti.");
    }
  }

  function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;
    setComments((current) => [...current, trimmed]);
    setComment("");
  }

  return (
    <section className="image-feed-slide" id={`template-${template.id}`} aria-label={`${template.name}, ${template.sector}`} style={{ "--feed-image": `url("${template.image}")` } as CSSProperties}>
      <figure className="image-feed-artwork">
        <Image src={template.image} alt={template.alt} fill priority={first} sizes="(max-width: 640px) 100vw, 52vh" />
        <figcaption className="image-feed-caption">
          <span>{template.sector}</span>
          <h2>{template.name}</h2>
          <small>Image de référence · aperçu visuel</small>
        </figcaption>
      </figure>
      <aside className="image-feed-actions" aria-label={`Actions pour ${template.name}`}>
        <button type="button" className={liked ? "image-feed-action is-liked" : "image-feed-action"} aria-pressed={liked} aria-label={liked ? "Retirer J’aime" : "J’aime"} onClick={() => setLiked((value) => !value)}>
          <span className="image-feed-action-icon"><FeedIcon name="like" /></span><span>J’aime</span>
        </button>
        <button type="button" className="image-feed-action" aria-label="Commenter" onClick={() => setCommentsOpen(true)}>
          <span className="image-feed-action-icon"><FeedIcon name="comment" /></span><span>Commenter</span>
        </button>
        <button type="button" className="image-feed-action" aria-label="Partager" onClick={() => void shareTemplate()}>
          <span className="image-feed-action-icon"><FeedIcon name="share" /></span><span>Partager</span>
        </button>
        <Link className="image-feed-action image-feed-customize" href={`/templates/${template.id}`} aria-label={`Choisir et éditer le modèle ${template.name}`}>
          <span className="image-feed-action-icon"><FeedIcon name="customize" /></span><span>Éditer</span>
        </Link>
        <span className="sr-only" aria-live="polite">{shareStatus}</span>
      </aside>
      {commentsOpen ? (
        <div className="image-feed-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCommentsOpen(false); }}>
          <section className="image-feed-comments" role="dialog" aria-modal="true" aria-labelledby={`comments-title-${template.id}`}>
            <button type="button" className="image-feed-dialog-close" onClick={() => setCommentsOpen(false)} aria-label="Fermer les commentaires">×</button>
            <h2 id={`comments-title-${template.id}`}>Commenter {template.name}</h2>
            <p className="image-feed-comment-note">Les commentaires restent dans cet aperçu local et ne sont pas publiés.</p>
            {comments.length ? <ul>{comments.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="image-feed-no-comments">Aucun commentaire pour le moment.</p>}
            <form onSubmit={addComment}>
              <label className="sr-only" htmlFor={`comment-${template.id}`}>Votre commentaire</label>
              <input id={`comment-${template.id}`} value={comment} onChange={(event) => setComment(event.currentTarget.value)} placeholder="Ajouter un commentaire…" maxLength={500} autoFocus />
              <button type="submit" disabled={!comment.trim()}>Envoyer</button>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="image-feed" aria-label="Flux de modèles visuels">
      <h1 className="sr-only">Images de référence des modèles</h1>
      <a className="skip-link" href="#template-education">Aller aux images des modèles</a>
      <div className="image-feed-scroll" aria-label="Défilez verticalement pour découvrir les modèles">
        {templateImages.map((template, index) => <TemplateSlide key={template.id} template={template} first={index === 0} />)}
      </div>
      <span className="sr-only">{templateImages.length} images de référence disponibles.</span>
    </main>
  );
}

