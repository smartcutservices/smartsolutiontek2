# Matrice des références visuelles sectorielles

Le registre conserve 69 secteurs candidats. La priorité de première version est limitée à education, single-product, multi-product, service-booking et restaurant; les autres travaux restent en réserve et ne constituent pas une approbation de publication, de paiements ou de collecte de données sensibles.

Workflow obligatoire : générer une référence idéale par profil avant son rendu; intégrer une image fixe de référence tant qu’aucune vidéo réelle n’existe; coder les sections et médias du template; comparer des captures aux mêmes viewports; documenter l’écart jusqu’au pixel-match. Aucun profil ne passe à « prêt » ou « publié » sans les gates métier/qualité du MD maître.

| # | ID | Secteur | Image de référence | Rendu | Captures / pixel-match |
|---:|---|---|---|---|---|
| 1 | education | Éducation et écoles | `apps/public-web/public/media/references/school-enrollment-reference-v1.png` | HTML/CSS dédié en brouillon | QA responsive passée; pixel-match à finir |
| 2 | training | Formations et cours | `apps/public-web/public/media/references/training-enrollment-reference-v1.png` | HTML/CSS dédié en brouillon | QA responsive passée; pixel-match à documenter |
| 3 | single-product | Commerce mono-produit | `apps/public-web/public/media/references/single-product-reference-v1.png` | HTML/CSS dédié en brouillon | QA Chrome 320/390/768/1440 px; captures dans `docs/visual-evidence/`; page 742×1816 vs ref 801×1962; pixel-match à finir |
| 4 | multi-product | Commerce multi-produits | `apps/public-web/public/media/references/multi-product-reference-v1.png` | HTML/CSS dédié en brouillon | QA Chrome 320/390/768/1440 px; captures dans `docs/visual-evidence/`; page 742×1372 vs ref 919×1711; écarts visuels à finir |
| 5 | restaurant | Restaurants et restauration rapide | `apps/public-web/public/media/references/restaurant-reference-v1.png` | HTML/CSS dédié Lakou; photos de plats, hero et salle générées et servies en WebP | QA Chrome 320/390/768/1440 px; captures dans `docs/visual-evidence/`; rendu 742×2075 vs ref 789×1993; proportions et quelques détails restent à ajuster |
| 6 | catering | Pâtisserie, cuisine et traiteur | `apps/public-web/public/media/references/catering-reference-v1.png` | HTML/CSS dédié Maison Safran; photos des créations et de l’atelier générées, servies en WebP | QA Chrome 320/390/768/1440 px; captures dans `docs/visual-evidence/`; rendu 742×1872 vs ref 809×1944; détails à rapprocher |
| 7 | service-booking | Réservation de services | `apps/public-web/public/media/references/service-booking-reference-v1.png` (803×1958) | HTML/CSS dédié Serein Studio; photos et détails dédiés servis en WebP | QA responsive 320/390/768/1440 px; captures dans `docs/visual-evidence/`; pixel-match à finir; moteur de réservation non connecté |
| 8 | beauty | Salons de beauté, coiffure et spa | `apps/public-web/public/media/references/beauty-reference-v1.png` (941×1672; built-in OpenAI image_gen); photos `beauty-photos-v1.png` and `beauty-gallery-v1.png` | HTML/CSS dédié Maison Néroli; variantes photo WebP | QA responsive 320/390/768/1440 px; captures dans `docs/visual-evidence/`; rendu 742×1348 vs référence 941×1672 (hauteur normalisée 1319 px, écart +2,2%); crops/typo à finir; aucun moteur de réservation connecté |
| 9 | portfolio | Portfolios et createurs | `apps/public-web/public/media/references/portfolio-reference-v1.png` (956x1646; OpenAI image_gen) | HTML/CSS dedie Atelier Solenne; 11 crops WebP extraits de la reference | QA 320/390/768/1440 px passee; capture desktop 742x1310 vs cible normalisee 1277 px (+2.6%); ajustements de crop, typo et espacements restants |
| 10 | agency | Entreprises et agences | `apps/public-web/public/media/references/agency-reference-v1.png` (951x1653; OpenAI image_gen) | HTML/CSS dedie LIGNE 09; cinq crops WebP extraits de la reference | QA 320/390/768/1440 px passee; capture desktop 742x1318 vs cible normalisee 1289 px (+2.3%); crop et micro-typographie a finir |
| 11 | craftspeople | Artisans et metiers | `apps/public-web/public/media/references/craftspeople-reference-v1.png` (951x1653; OpenAI image_gen) | HTML/CSS dedie Atelier Tiko; 12 crops WebP, dont quatre icones procedes, extraits de la reference | QA 320/390/768/1440 px passee; capture desktop 742x1291 vs cible normalisee 1289 px (+0.2%); titre, navigation et petits ecarts visuels a finir |
| 12 | events | Evenements | `apps/public-web/public/media/references/events-reference-v1.png` (951x1653; OpenAI image_gen) | HTML/CSS dedie Rasin & Rythmes; six crops WebP extraits de la reference | QA 320/390/768/1440 px passee; capture desktop 742x1273 vs reference normalisee 1290 px (-1.3%); ecarts de crop et typographie a finir; aucune programmation ou inscription reelle |
| 13 | ticketing | Billetterie | ticketing-reference-v1.png (941x1672) · NOUVEL VAG; photo hero ticketing-hero-photo-v1.png | Rendu HTML/CSS dédié, image de scène WebP et 8 crops WebP; feed et galerie; vente inactive | QA Chrome 320/390/768/1440 px passée; captures dans docs/visual-evidence/; rendu desktop 742x1318 vs référence normalisée 742x1317 (+0,1%); détails de composition à affiner |
| 14 | real-estate | Immobilier | `apps/public-web/public/media/references/real-estate-reference-v1.png` (940×1672; hero séparé `real-estate-hero-photo-v1.png`); WebP prêt pour le feed | Rendu HTML/CSS dédié HABITAT NOU; photo hero et 7 images WebP de contenu | QA Chrome 320/390/768/1440 px; captures dans `docs/visual-evidence/`; capture desktop 742×1378 vs référence normalisée 742×1319,7 (+4,4 %); pixel-match détails à terminer |
| 15 | hospitality | Hôtels et hébergements | `apps/public-web/public/media/references/hospitality-reference-v1.png` (941×1672; image_gen), hero séparé; variante WebP | HTML/CSS dédié MAISON CORAIL; 10 crops WebP; feed et galerie | QA Chrome 320/390/768/1440 px passée; captures dans `docs/visual-evidence/`; capture desktop 742×1347 vs référence normalisée 742×1319,7 (+2,1%); détails à affiner |
| 16 | tourism | Tourisme et excursions | `apps/public-web/public/media/references/tourism-reference-v1.png` (941×1672; image_gen), photo hero séparée; variantes WebP | Rendu HTML/CSS dédié LAKOU ESCAPADES; hero et 9 crops WebP; feed et galerie | QA Chrome 320/390/768/1440 px passée, quatre actions visibles; capture desktop 742×1283 vs référence normalisée 742×1318,4 (-2,7%); pixel-match détaillé à poursuivre |
| 17 | vehicles | Automobile et motos | `apps/public-web/public/media/references/vehicles-reference-v1.png` (941×1672; image_gen), photo hero séparée; variantes WebP | Rendu HTML/CSS dédié ROUTE NOIRE; hero et 6 crops WebP; feed et galerie | QA navigateur 320/390/768/1440 px passée, sans overflow et wizard focalisé; capture desktop 742×1292 vs référence normalisée 742×1319 (-2,0 %); pixel-match détaillé à faire |
| 18 | nonprofits | Associations et ONG | Référence conceptuelle : `apps/public-web/public/media/references/nonprofits-reference-v1.png` (836×1881; OpenAI image_gen, 2026-10-15), conservée hors priorité | Aucun rendu ni questionnaire dédié; non ajoutée au feed | Référence seulement; QA responsive et pixel-match non effectués |
| 19 | fundraising | Collectes et dons | À générer | À construire après référence | À faire |
| 20 | recruitment | Recrutement et RH | À générer | À construire après référence | À faire |
| 21 | health | Santé — vitrine professionnelle | À générer | À construire après référence | À faire |
| 22 | fitness | Fitness, sport et clubs | À générer | À construire après référence | À faire |
| 23 | rentals | Immobilier locatif et locations | À générer | À construire après référence | À faire |
| 24 | home-services | Services à domicile | À générer | À construire après référence | À faire |
| 25 | delivery | Livraison et logistique | À générer | À construire après référence | À faire |
| 26 | photography | Photographie et vidéo | À générer | À construire après référence | À faire |
| 27 | entertainment | Musique et divertissement | À générer | À construire après référence | À faire |
| 28 | publishing | Livres et publications | À générer | À construire après référence | À faire |
| 29 | digital-products | Produits numériques | À générer | À construire après référence | À faire |
| 30 | repair | Réparation et maintenance | À générer | À construire après référence | À faire |
| 31 | agriculture | Agriculture et producteurs | À générer | À construire après référence | À faire |
| 32 | legal-advice | Professionnels juridiques et conseil | À générer | À construire après référence | À faire |
| 33 | finance | Services financiers — vitrine | À générer | À construire après référence | À faire |
| 34 | faith | Lieux de culte et communautés | À générer | À construire après référence | À faire |
| 35 | weddings | Mariages et cérémonies | À générer | À construire après référence | À faire |
| 36 | childcare | Enfance et garde | À générer | À construire après référence | À faire |
| 37 | pets | Animaux et services vétérinaires | À générer | À construire après référence | À faire |
| 38 | construction | Construction et architecture | À générer | À construire après référence | À faire |
| 39 | saas | Technologie et SaaS | À générer | À construire après référence | À faire |
| 40 | personal-page | CV et pages personnelles | À générer | À construire après référence | À faire |
| 41 | media | Médias, blogs et magazines | À générer | À construire après référence | À faire |
| 42 | private-clubs | Communautés et clubs privés | À générer | À construire après référence | À faire |
| 43 | exams | Concours et examens | À générer | À construire après référence | À faire |
| 44 | surveys | Enquêtes et formulaires | À générer | À construire après référence | À faire |
| 45 | qr-menu | Menus et catalogues QR | À générer | À construire après référence | À faire |
| 46 | wholesale | Vente en gros / B2B | À générer | À construire après référence | À faire |
| 47 | fashion | Mode et accessoires | À générer | À construire après référence | À faire |
| 48 | artisans | Artisanat artistique | À générer | À construire après référence | À faire |
| 49 | cleaning | Nettoyage et entretien | À générer | À construire après référence | À faire |
| 50 | equipment-rental | Location d'équipements | À générer | À construire après référence | À faire |
| 51 | institutions | Institutions et collectivités | À générer | À construire après référence | À faire |
| 52 | industry-b2b | Industrie et fournisseurs B2B | À générer | À construire après référence | À faire |
| 53 | funeral-services | Services funéraires et cérémonies | À générer | À construire après référence | À faire |
| 54 | security | Sécurité et surveillance | À générer | À construire après référence | À faire |
| 55 | energy-environment | Énergie et environnement | À générer | À construire après référence | À faire |
| 56 | public-services | Services publics et démarches | À générer | À construire après référence | À faire |
| 57 | universities | Universités et académies | À générer | À construire après référence | À faire |
| 58 | cafes-snacks | Cafés et snacks | À générer | À construire après référence | À faire |
| 59 | medical-centers | Laboratoires et centres médicaux | À générer | À construire après référence | À faire |
| 60 | pharmacies | Pharmacies — vitrine informative | À générer | À construire après référence | À faire |
| 61 | jewelry-luxury | Bijoux et produits de luxe | À générer | À construire après référence | À faire |
| 62 | electronics | Technologie et électronique | À générer | À construire après référence | À faire |
| 63 | arts-education | Éducation artistique | À générer | À construire après référence | À faire |
| 64 | printing-personalization | Impression et personnalisation | À générer | À construire après référence | À faire |
| 65 | freelancers | Freelances | À générer | À construire après référence | À faire |
| 66 | support-assistance | Support et assistance | À générer | À construire après référence | À faire |
| 67 | classifieds | Petites annonces | À générer | À construire après référence | À faire |
| 68 | groceries-markets | Épiceries et marchés | À générer | À construire après référence | À faire |
| 69 | local-businesses | Petites entreprises locales | À générer | À construire après référence | À faire |

La référence nonprofits du 2026-10-15 a été créée avant le changement de priorité et est conservée sans intégration. Elle ne compte pas parmi les 17 références du feed et aucun code de rendu n’a été ajouté.
