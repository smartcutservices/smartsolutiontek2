"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { sectors } from "./registry";

const referenceImages: Partial<Record<string, { src: string; width: number; height: number; alt: string }>> = {
  education: { src: "/media/references/school-enrollment-form-reference-v2.png", width: 948, height: 1659, alt: "Formulaire d’inscription scolaire en ligne, format vertical." },
  training: { src: "/media/references/training-enrollment-reference-v1.png", width: 946, height: 1652, alt: "Référence visuelle du modèle de formation." },
  "single-product": { src: "/media/references/single-product-reference-v1.png", width: 801, height: 1962, alt: "Référence visuelle d’une boutique artisanale à produit unique." },
  "multi-product": { src: "/media/references/multi-product-reference-v1.png", width: 919, height: 1711, alt: "Référence visuelle d’une boutique artisanale à plusieurs produits." },
  restaurant: { src: "/media/references/restaurant-reference-v1.png", width: 789, height: 1993, alt: "Référence visuelle du restaurant haïtien Lakou" },
  catering: { src: "/media/references/catering-reference-v1.png", width: 809, height: 1944, alt: "Référence visuelle de l’atelier de pâtisserie et réception Maison Safran" },
  "service-booking": { src: "/media/references/service-booking-reference-v1.png", width: 803, height: 1958, alt: "Référence visuelle du studio de bien-être Serein Studio" },
  "real-estate": { src: "/media/references/real-estate-reference-v1.webp", width: 940, height: 1672, alt: "Référence visuelle du catalogue immobilier Habitat Nou; biens indicatifs sans disponibilité confirmée" },
  hospitality: { src: "/media/references/hospitality-reference-v1.webp", width: 941, height: 1672, alt: "Référence visuelle de la maison d’hôtes Maison Corail; réservation non active." },
  tourism: { src: "/media/references/tourism-reference-v1.webp", width: 941, height: 1672, alt: "Référence visuelle de Lakou Escapades; excursions illustratives et réservation inactive." },
  vehicles: { src: "/media/references/vehicles-reference-v1.webp", width: 941, height: 1672, alt: "Référence visuelle de Route Noire; informations automobiles à confirmer." },
  ticketing: { src: "/media/references/ticketing-reference-v1.webp", width: 941, height: 1672, alt: "Référence visuelle du festival Nouvel Vag; billetterie indicative, sans vente active" },
  events: { src: "/media/references/events-reference-v1.webp", width: 951, height: 1653, alt: "Référence visuelle du festival Rasin & Rythmes." },
  craftspeople: { src: "/media/references/craftspeople-reference-v1.webp", width: 951, height: 1653, alt: "Référence visuelle de l’atelier artisanal Atelier Tiko." },
  agency: { src: "/media/references/agency-reference-v1.webp", width: 951, height: 1653, alt: "Référence visuelle du studio de marque LIGNE 09." },
  portfolio: { src: "/media/references/portfolio-reference-v1.webp", width: 956, height: 1646, alt: "Référence visuelle du portfolio Atelier Solenne." },
  beauty: { src: "/media/references/beauty-reference-v1.png", width: 941, height: 1672, alt: "Référence visuelle du salon Maison Néroli" },
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

export function TemplateGallery() {
  const [sectorFilter, setSectorFilter] = useState("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const term = normalize(query.trim());
    return sectors.filter((sector) =>
      (sectorFilter === "all" || sector.id === sectorFilter)
      && (!term || normalize(`${sector.name} ${sector.template} ${sector.detail}`).includes(term)),
    );
  }, [sectorFilter, query]);

  return (
    <>
      <nav className="template-filters" aria-label="Filtrer par secteur">
        <button
          type="button"
          className={sectorFilter === "all" ? "template-filter active" : "template-filter"}
          aria-pressed={sectorFilter === "all"}
          onClick={() => setSectorFilter("all")}
        >
          Tous les secteurs
        </button>
        {sectors.map((sector) => (
          <button
            key={sector.id}
            type="button"
            className={sectorFilter === sector.id ? "template-filter active" : "template-filter"}
            aria-pressed={sectorFilter === sector.id}
            onClick={() => setSectorFilter(sector.id)}
          >
            {sector.name}
          </button>
        ))}
      </nav>
      <form className="template-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor="template-query">Rechercher parmi les {sectors.length} profils sectoriels</label>
        <input
          id="template-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Rechercher un secteur ou un besoin"
          autoComplete="off"
        />
        {query && <button type="button" onClick={() => setQuery("")}>Effacer la recherche</button>}
      </form>
      <p className="template-count" role="status" aria-live="polite">
        {visible.length} profil{visible.length === 1 ? "" : "s"} candidat{visible.length === 1 ? "" : "s"}
      </p>
      {visible.length > 0 ? (
        <div className="templates-grid">
          {visible.map((sector) => {
            const index = sectors.findIndex((item) => item.id === sector.id) + 1;
            const reference = referenceImages[sector.id];
            return (
              <Link className="template-tile" href={`/templates/${sector.id}`} key={sector.id}>
                {reference ? <Image className="template-tile-image" src={reference.src} width={reference.width} height={reference.height} sizes="(max-width:560px) 100vw, (max-width:850px) 50vw, 33vw" alt={reference.alt} /> : <span className="template-tile-image-placeholder" aria-hidden="true" />}
                <span className="sector-eyebrow">{String(index).padStart(2, "0")} / {sectors.length}</span>
                <h2>{sector.name}</h2>
                <p>{sector.template}</p>
                <span className="template-arrow">Ouvrir et éditer le modèle →</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="template-no-results">
          <h2>Aucun profil trouvé</h2>
          <p>Modifiez votre recherche ou réinitialisez les filtres.</p>
          <button type="button" onClick={() => { setSectorFilter("all"); setQuery(""); }}>
            Réinitialiser
          </button>
        </div>
      )}
    </>
  );
}

