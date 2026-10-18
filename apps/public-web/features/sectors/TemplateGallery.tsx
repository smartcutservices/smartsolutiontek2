"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { sectors } from "./registry";

const referenceImages: Partial<Record<string, { src: string; width: number; height: number; alt: string }>> = {
  education: { src: "/media/references/school-enrollment-form-reference-v1.png", width: 1536, height: 1024, alt: "Référence du formulaire scolaire professionnel sur ordinateur et téléphone." },
  training: { src: "/media/references/training-enrollment-reference-v1.png", width: 946, height: 1652, alt: "RÃ©fÃ©rence visuelle du template de formation" },
  "single-product": { src: "/media/references/single-product-reference-v1.png", width: 801, height: 1962, alt: "RÃ©fÃ©rence visuelle dâ€™une boutique artisanale mono-produit" },
  "multi-product": { src: "/media/references/multi-product-reference-v1.png", width: 919, height: 1711, alt: "RÃ©fÃ©rence visuelle dâ€™une boutique multi-produits" },
  restaurant: { src: "/media/references/restaurant-reference-v1.png", width: 789, height: 1993, alt: "RÃ©fÃ©rence visuelle du restaurant haÃ¯tien Lakou" },
  catering: { src: "/media/references/catering-reference-v1.png", width: 809, height: 1944, alt: "RÃ©fÃ©rence visuelle de lâ€™atelier de pÃ¢tisserie et rÃ©ception Maison Safran" },
  "service-booking": { src: "/media/references/service-booking-reference-v1.png", width: 803, height: 1958, alt: "RÃ©fÃ©rence visuelle du studio de bien-Ãªtre Serein Studio" },
  "real-estate": { src: "/media/references/real-estate-reference-v1.webp", width: 940, height: 1672, alt: "RÃ©fÃ©rence visuelle du catalogue immobilier Habitat Nou; biens indicatifs sans disponibilitÃ© confirmÃ©e" },
  hospitality: { src: "/media/references/hospitality-reference-v1.webp", width: 941, height: 1672, alt: "RÃ©fÃ©rence visuelle de la maison dâ€™hÃ´tes Maison Corail; rÃ©servation non active." },
  tourism: { src: "/media/references/tourism-reference-v1.webp", width: 941, height: 1672, alt: "RÃ©fÃ©rence visuelle de Lakou Escapades; excursions illustratives et rÃ©servation inactive." },
  vehicles: { src: "/media/references/vehicles-reference-v1.webp", width: 941, height: 1672, alt: "RÃ©fÃ©rence visuelle de Route Noire; informations automobiles Ã  confirmer." },
  ticketing: { src: "/media/references/ticketing-reference-v1.webp", width: 941, height: 1672, alt: "RÃ©fÃ©rence visuelle du festival Nouvel Vag; billetterie indicative, sans vente active" },
  events: { src: "/media/references/events-reference-v1.webp", width: 951, height: 1653, alt: "Reference visuelle du festival Rasin & Rythmes" },
  craftspeople: { src: "/media/references/craftspeople-reference-v1.webp", width: 951, height: 1653, alt: "Reference visuelle de l?atelier artisanal Atelier Tiko" },
  agency: { src: "/media/references/agency-reference-v1.webp", width: 951, height: 1653, alt: "Reference visuelle du studio de marque LIGNE 09" },
  portfolio: { src: "/media/references/portfolio-reference-v1.webp", width: 956, height: 1646, alt: "R\u00e9f\u00e9rence visuelle du portfolio Atelier Solenne" },
  beauty: { src: "/media/references/beauty-reference-v1.png", width: 941, height: 1672, alt: "RÃ©fÃ©rence visuelle du salon Maison NÃ©roli" },
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
                <span className="template-arrow">Ouvrir et Ã©diter le modÃ¨le â†’</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="template-no-results">
          <h2>Aucun profil trouvÃ©</h2>
          <p>Modifiez votre recherche ou rÃ©initialisez les filtres.</p>
          <button type="button" onClick={() => { setSectorFilter("all"); setQuery(""); }}>
            RÃ©initialiser
          </button>
        </div>
      )}
    </>
  );
}

