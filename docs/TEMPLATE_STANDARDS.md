# Standards des templates
Statut : cadrage V0.9.

## Manifeste versionné
Chaque template a templateId stable/immuable, version, catégorie, renderer, capacités, wizard versionné, compatibilité, propriétés éditables, assets, preview et statut. IDs template, vidéo et offre restent distincts.

## Édition sûre
Propriétés typées uniquement : texte assaini, couleurs, polices, images, sections et options métier déclarées. Pas de JS/HTML arbitraire ni accès code. Brouillon→aperçu→publication atomique ; versions restaurables. Migrations conservent les projets ou signalent incompatibilité.

## Qualité
Mobile-first, clavier, lecteur d’écran, contrastes, zoom, états UI. Assets licenciés, WebP si éligible, dimensions/ratio réservés. GSAP/Three/R3F à la demande, fallback et reduced motion. SEO par visibilité ; pages privées protégées/noindex. Pas de stats fictives. Tests tenant/métier/E2E. Pas vendable avant build, manifest, preview et publication admin. La vidéo doit correspondre au template et avoir droits vérifiés.

Une catégorie approuvée est couverte par un template fonctionnel testé (rendu, wizard, métier, dashboard, publication), pas une maquette. Les 69 profils candidats ne sont pas approuvés.

## Contrat du catalogue public local
Le schema frontend est `apps/public-web/app/catalog-types.ts`; le manifeste courant est `apps/public-web/content/catalog.json` (vide jusqu aux premieres demos approuvees). Une entree separe `templateId/version`, famille de solution, secteur approuve ou candidat, moteurs metier, statut technique/catalogue, video, poster, route preview et identifiant optionnel d offre. Famille, categorie et moteur ne sont pas interchangeables.

`npm run catalog:validate` verifie les IDs stables/uniques, la version, le secteur, les moteurs, la route et les assets locaux sous `public/media/`. Une entree publiee exige un template deployee, secteur approuve, vraie video MP4, poster, alt text et fichier `docs/licenses/*.md` documentant proprietaire et droits audio. `npm run build` execute ce controle avant compilation. Les offres peuvent rester absentes ; cela ne cree aucune autorisation d achat ni aucun prix.

## Famille produit et publication
Les familles suivent la section 3 du maître : Inscription en ligne et E-commerce sont validées ; Réservation en ligne, Mini-boutique et Site vitrine métier restent recommandées. Les familles recommandées sont visibles comme propositions dans le prototype et le validateur refuse toute entrée publiée dans ces familles jusqu’à leur approbation. Les catégories sectorielles restent une taxonomie distincte à approuver.
## Manifestes sectoriels locaux (prototype)
Le registre versionné dérivé des 69 profils candidats est défini dans `apps/public-web/features/sectors/manifests.ts`; chaque manifeste demeure `draft`, `unpublished`, `local-only`, avec liste d’exigences non satisfaites. `docs/TEMPLATE_CATALOG.md` relie chaque ID à la version brouillon. Ce mécanisme local ne remplace pas la publication/admin de P4 ni l’approbation et les tests opérationnels P11.
## Workflow visuel obligatoire — image d’abord
1. Générer une image de référence idéale du template complet avant toute implémentation de son rendu; la versionner sous `apps/public-web/public/media/references/` et noter son template/secteur, l’outil de génération et sa version.
2. En l’absence de vidéo réelle, afficher cette image en aperçu par défaut. Nommer explicitement ce média « image de référence »; ne jamais le présenter comme une vidéo, une démo publiée ou une preuve de fonctionnement.
3. Implémenter le site avec des composants réels, puis rapprocher composition, espacements, couleurs, typographies, images et icônes de la référence. Utiliser les mêmes viewports de capture et adapter les layouts responsive.
4. Produire les images et icônes de contenu nécessaires; préférer les icônes vectorielles natives lorsqu’elles font partie du système d’interface commun.
5. Conserver la référence, les captures comparatives et les écarts connus dans le dossier de preuve. Une référence statique ne remplace jamais le vrai site, ses tests métier, une vidéo réelle ni les droits médias requis pour publication.

### Références actuellement générées
- Éducation/écoles : `apps/public-web/public/media/references/school-enrollment-reference-v1.png`; planches photo `school-enrollment-photos-v1.png` et `school-enrollment-details-v1.png`.
- Formation/cours : `apps/public-web/public/media/references/training-enrollment-reference-v1.png`; planche photo `training-enrollment-photos-v1.png`.
- Commerce mono-produit : `apps/public-web/public/media/references/single-product-reference-v1.png`; planche photo tote/atelier `single-product-photos-v2.png` et photo matières `single-product-materials-v1.png`.
- Commerce multi-produits :
- Events : `apps/public-web/public/media/references/events-reference-v1.png` (951x1653; OpenAI image_gen); six crops WebP sont derives de la reference.
- Craftspeople : `apps/public-web/public/media/references/craftspeople-reference-v1.png` (951x1653; OpenAI image_gen); douze crops WebP sont derives, dont quatre icones des etapes.
- Agency : `apps/public-web/public/media/references/agency-reference-v1.png` (951x1653; OpenAI image_gen); cinq crops WebP sont derives de la reference.
- Portfolio : `apps/public-web/public/media/references/portfolio-reference-v1.png` (956x1646; outil integre OpenAI image_gen, version outil non exposee); onze crops WebP sont derives de cette reference.
- Restauration : `apps/public-web/public/media/references/restaurant-reference-v1.png`; traiteur : `catering-reference-v1.png`; r?servation de services : `service-booking-reference-v1.png`; beauty : `beauty-reference-v1.png` avec les planches `beauty-photos-v1.png` et `beauty-gallery-v1.png`.


Les 17 templates education, training, single-product, multi-product, restaurant, catering, service-booking, beauty, portfolio, agency, craftspeople, events, ticketing, real-estate, hospitality, tourism et vehicles ont un rendu HTML/CSS dédié en brouillon. Les captures responsive vérifiées et les écarts figurent dans `docs/IMAGE_REFERENCE_CATALOG.md`. Le pixel-match détaillé et la QA desktop du profil véhicules restent à terminer; 52 profils attendent encore leur référence et leur rendu.


- Ticketing : apps/public-web/public/media/references/ticketing-reference-v1.png (941x1672; image_gen), photo hero ticketing-hero-photo-v1.png; variante WebP et huit crops sous apps/public-web/public/media/ticketing/. La billetterie demeure illustrative, sans checkout actif.
- Immobilier : `apps/public-web/public/media/references/real-estate-reference-v1.png` (940×1672; image_gen), photo hero distincte et variante WebP; sept images WebP de contenu sous `apps/public-web/public/media/real-estate/`. Référence, aperçu et fiche restent en brouillon.
- Hôtellerie : `apps/public-web/public/media/references/hospitality-reference-v1.png` (941×1672; image_gen), photo hero distincte, variante WebP et dix images WebP sous `apps/public-web/public/media/hospitality/`. Référence, aperçu et fiche restent en brouillon.
- Tourisme : `apps/public-web/public/media/references/tourism-reference-v1.png` (941×1672; image_gen), photo hero distincte, variantes WebP, neuf crops sous `apps/public-web/public/media/tourism/`; QA responsive effectuée, rendu et profil restent en brouillon.
- Véhicules : `apps/public-web/public/media/references/vehicles-reference-v1.png` (941×1672; image_gen), photo hero distincte, variantes WebP, six crops sous `apps/public-web/public/media/vehicles/`; aperçu brouillon, QA jusqu’à 768 px effectuée.

## Priorité de la première version — 2026-10-15
Cinq profils sont prioritaires : education, single-product, multi-product, service-booking et restaurant. Le registre conserve les 69 candidats et les rendus hors de cette liste; ils ne sont pas supprimés, mais n’avancent pas dans le lot de première version. Une référence ONG générée est conservée en réserve, sans intégration au feed.
