# Vérifications récentes — 2026-10-12

- `npm test`: 134/134.
- `npm run lint`, `npm run typecheck`: trois workspaces réussis.
- `npm run build:all`: public-web, admin-web, sites-runtime réussis; public-web reconstruit ensuite avec le rendu formation/assets et a pré-rendu ses 69 profils.
- Vérifications du lot commerce : `npm test` 134/134; lint, typecheck et `build:all` réussis après les templates mono/multi-produit. Public-web pré-rend 77 routes.
- `npm run media:optimize`: neuf planches photo sources converties en WebP, réduction de 90–93 %; sources PNG de référence conservées. Les neuf URLs CSS WebP renvoient HTTP 200.
- `tools/verify-sector-profiles.ps1`: 69 IDs distincts, prompts/questionnaires correspondants, cinq flows.
- `tools/verify-sector-routes.ps1`: 69/69 HTTP 200.
- `tools/verify-responsive-browser.mjs`: feed 320 px, tous les 69 questionnaires à 390 px, cinq compositions représentatives et `single-product`/`multi-product` à 320/768/1440 px; aucun débordement et focus de la question active.
- Captures de pages complètes à 1440 px viewport archivées dans `docs/visual-evidence/`; leurs dimensions mesurées et celles des références sont suivies dans `docs/IMAGE_REFERENCE_CATALOG.md`.
- Le pixel-match exact des quatre pages dédiées reste à faire avec des captures de même dimension que leur référence. Ces tests ne valident ni l’ensemble WCAG, ni les contrats métier/tenants Firebase, SmartCut, le paiement réel, les licences ou le lancement.

---
# Stratégie de test et preuves

## Résultats exécutés — 2026-10-12

- Environnement : Node 22.22.0 et npm 10.9.4 portables; `package-lock.json` généré à partir des manifestes du workspace.
- `npm test` : 134 réussites, 0 échec, 0 ignoré.
- `npm run lint` : réussi sur public-web, admin-web et sites-runtime.
- `npm run typecheck` : réussi sur les trois applications.
- `npm run build:all` : réussi; public-web génère 77 routes (dont les 69 profils), les deux autres applications produisent leurs routes statiques.
- `tools/verify-sector-profiles.ps1` : réussi pour les 69 profils et questionnaires.
- `tools/verify-sector-routes.ps1` : réussi, les 69 routes locales renvoient HTTP 200 avec les marqueurs de profil attendus.
- La revue visuelle clavier/mobile n'a pas été exécutée dans un vrai navigateur. Le feed ne contient toujours aucune démo vidéo publiée.
- `npm install` a signalé cinq vulnérabilités de haute sévérité; `npm audit --json` n'a pas pu joindre son endpoint. Les avis et correctifs exacts restent à établir; aucun `audit fix` n'a été lancé.

## Commandes de vérification

Depuis `apps/public-web` :

```sh
npm test
npm run catalog:validate
npm run typecheck
npm run lint
npm run build
```

Depuis la racine du depot :

```sh
node --test functions/tests/smartcut-adapter.test.mjs
```

Le lockfile est à conserver avec le workspace. Exécuter les contrôles après chaque changement de logique; rapporter les échecs et les contrôles non exécutés séparément. L'audit npm doit être repris lorsque l'endpoint de sécurité est accessible.

## Contrats purs et couverture actuelle

- Catalogue : validateurs de manifestes, assets locaux, droits, chemins, doublons et WebVTT.
- Questionnaire : schema declaratif, 23 champs sectoriels, branches conditionnelles, validation des valeurs, mapping de reponses et exclusion des reponses cachees.
- Brouillon P5 : primitives et valeurs composites, autosauvegarde par politique pure, migrations additives 1.0.0 a 1.7.0, conflits et tombstone; dix tests sources.
- Paiements clients : le choix non masque ou affiche les usages conditionnels; une reponse cachee est rejetee.
- Apercu sectoriel : selection du texte de CTA selon le contraste WCAG AA sur les couleurs opaques; deux tests source representatifs, non executes.
- SmartCut : les trois capacites du stub rejettent avec `SMARTCUT_NOT_CONFIGURED`; aucun appel reseau ou succes de paiement n'est possible dans ce port.

Total statique courant : 134 déclarations dans onze fichiers `*.test.mjs`; leur résultat exécuté à cette date est 134/134 réussi.

## Wizard et apercu — scenarios navigateur a executer

1. Une question par carte, progression coherente avec la branche active, retour, resume et focus sur la question courante.
2. Repondre non aux paiements clients : aucune question de details ou d'usage de paiement ne s'affiche. Repondre oui : les choix d'inscription, commande et reservation apparaissent.
3. Modifier une reponse parent pour masquer une branche; verifier son retrait du brouillon, du resume et du mapping de l'aperçu.
4. Choisir, changer et vider les sections; verifier cartes, navigation et message d'aperçu vide. Verifier les couleurs et textes mappees.
5. Reprendre des brouillons 1.0.0, 1.1.0, 1.2.0, 1.3.0 et 1.4.0 sans perdre les valeurs compatibles; garder une version inconnue intacte.
6. Fermer avant le delai de sauvegarde, recharger, ouvrir deux onglets, provoquer un conflit, effacer un brouillon et simuler quota/stockage indisponible.
7. Tester clavier, focus, lecteur d'ecran, annonces d'erreur, tactile, zoom 200 %, orientations et viewports de 320 a 2560 px.

Aucun de ces scenarios n'est marque passe avant execution. `localStorage` reste une sauvegarde du navigateur, pas une sauvegarde serveur.

## Firebase, tenancy et donnees sensibles

Avant activation serveur : tests Firebase Emulator deny-by-default, lecture/ecriture croisee entre tenants, IDOR, role admin falsifie, utilisateur suspendu, upload invalide/surdimensionne, donnees privees et retention. Tester migrations et restauration avec fixtures fictives. Ne jamais executer ces tests en production ni lire/exporter des donnees personnelles pour l'audit.

## Paiements, publication et moteurs metier

Apres obtention du contrat SmartCut et d'une sandbox : tester idempotence, confirmations serveur, retards/doubles callbacks, echec, expiration, remboursement, concurrence de retrait et rapprochement. Aucune preuve n'existe aujourd'hui; l'API et la sandbox restent inconnues, et le stub actuel est volontairement inutilisable.

Avant P8/P11/P12 : tester trois tenants fictifs sur deux domaines, acces direct et refresh, TLS, canonical/robots/cache, absence de fuite, publication atomique et rollback. Chaque moteur et template retenu exige ses tests metier E2E, revue responsive/accessibilite, licences des medias, SEO et mesures de performance.

Chaque rapport doit distinguer succes execute, echec execute et non execute, avec commande, environnement, fixture, resultat, limites et risque residuel. Aucun paiement ou acces client reel ne doit etre simule comme valide.

## Nouveaux tests source — P5 apercu sectoriel
`apps/public-web/tests/sector-preview-copy.test.mjs` ajoute 4 cas: contexte de campagne, priorite de refonte, priorite de l'offre configuree et replis sur donnees absentes/invalides. Ils sont inclus dans le total statique: 113 declarations reparties dans 8 fichiers de suite. Ils n'ont pas ete executes; Node, npm et npx ne sont pas disponibles.
## Commandes depuis la racine workspace
- `npm test` : decouverte Node des fichiers `*.test.mjs` du depot, y compris `functions/tests`.
- `npm run test:public` : suites du frontend public.
- `npm run test:functions` : suite(s) des fonctions.
Ces commandes ne sont pas exécutées faute de Node/npm. Le total source observé est 134 déclarations dans 11 fichiers.
## Schema sectoriel 1.5.0 — guidance de paiement (jalon precedent)
Le texte d’aide de la branche conditionnelle des paiements est adapte au secteur, avec garde-fous pour dons, santé, pharmacies, contenu numérique et SaaS. Les IDs d’options restent stables; les brouillons 1.0.0 à 1.4.0 migrent de façon additive vers 1.5.0. Cinq tests dédiés et un test de conservation d’un ancien choix ont été ajoutés. Total statique : 119 déclarations dans neuf fichiers; aucun test exécuté.

## Schema sectoriel 1.6.0 — libelles adaptes aux secteurs
Les six sections conservent leurs IDs stables; questionnaire et navigation reprennent des libelles adaptes au parcours puis au secteur. Les brouillons connus 1.0.0 a 1.5.0 migrent de facon additive vers 1.6.0. Quatre tests source couvrent les libelles et replis. Total statique observe apres cet ajout : 124 declarations dans dix fichiers; aucun test execute.


## Progression — réponses composites vides
Le moteur traite une valeur composite vide (montant sans valeur, objet ou liste sans élément renseigné) comme non répondue pour la progression et les conditions answered. Un cas source couvre le montant vide/rempli et la visibilité de sa dépendance. Total statique actuel : 124 déclarations dans dix fichiers; aucun test exécuté.


## Route de validation serveur P5 — à exécuter
Exercer depuis le navigateur POST valide et invalide, branche masquée avec réponse obsolète, ID secteur inconnu, schemaId incohérent, version périmée, JSON malformé, Content-Type incorrect, clé inattendue et corps au-dessus de 64 KiB. Vérifier 200/422/404/400/409/415/413, no-store, absence de persistance et de renvoi des réponses. Le wizard appelle la route uniquement après activation explicite du bouton de relecture. Ces scénarios restent non exécutés.

## Validation serveur P5 — couverture source
Sept tests couvrent le contrat pur de validation : réponse correcte, champ obligatoire manquant, réponse obsolète sur branche masquée, secteur/schema/version inconnus ou périmés, champ de requête supplémentaire, JSON malformé et corps supérieur à la limite (Content-Length et flux). Ils ne couvrent pas l’adaptateur HTTP Next, les règles de déploiement, la confidentialité des logs de plateforme ni un navigateur réel. Total statique actuel : 134 déclarations dans onze fichiers; aucun test exécuté.

Le moteur expose `countDiscardedAnsweredQuestions` pour mesurer les réponses significatives supprimées par une réconciliation; le wizard utilise ce nombre pour afficher un avertissement et restaurer le brouillon antérieur. Le cas source couvre une branche remplie, une valeur blanche ignorée et une réponse obsolète supprimée. Test non exécuté faute de Node/npm.

## P3 — accueil sans média publié
Avec un catalogue vide, vérifier le message sans fausse démo, le lien dynamique vers les profils candidats, clavier/focus, tailles téléphone/desktop et annonces lecteur d’écran. Avec une recherche sans résultat quand des démos existent, vérifier le bouton d’effacement des filtres. Scénario navigateur non exécuté.
5. Pour les profils de chacun des cinq moteurs, vérifier la composition dédiée en largeur desktop et téléphone : candidature (étapes numérotées), réservation (liste de prestations), contenu (rubriques éditoriales), commande (cartes de catalogue), contact (sections de service). Vérifier que chaque écran annonce encore « aperçu local » et qu’aucun CTA ne déclenche une transaction métier.

Feed P3 : vérifier les boutons précédente/suivante au clavier et au toucher, leur état désactivé aux bornes des filtres, la mise à jour de la vidéo active après défilement et `prefers-reduced-motion`. Pas de démo publiée dans le catalogue courant; QA réelle différée à la disponibilité de médias licenciés et d’un navigateur.

## Audit statique contraste opaque
`powershell -NoProfile -ExecutionPolicy Bypass -File tools\verify-contrast.ps1` exécute un contrôle PowerShell autonome, sans dépendance Node. Résultat observé : 21/21 paires texte/surface opaques ≥4,5:1. Il ne couvre ni transparences compositées, ni focus/bordures, ni assets vidéo, ni test de lecteur d’écran/navigateur.

## Controle statique PowerShell des profils sectoriels
`tools/verify-sector-profiles.ps1` a ete execute avec succes le 2026-10-12 : 69 IDs du registre correspondent a 69 profils aux prompts distincts, avec 23 declarations de questions et les cinq parcours d'apercu. Ce controle lit les sources et ne remplace pas la validation des schemas au build, les tests Node ou la QA navigateur.

## Référence image-first restaurant
`restaurant` : 134/134 tests, lint, typecheck et builds des trois workspaces réussis après le rendu dédié. `tools/verify-responsive-browser.mjs` passé sur localhost pour feed et restaurant à 390 px, puis restaurant à 320/768/1440 px; aucun débordement, focus de question actif vérifié. Captures dans `docs/visual-evidence/`. Le rendu 742×2075 reste à rapprocher de la référence 789×1993; la preuve responsive ne signifie pas pixel-match.

## Flux d’accueil et référence catering
QA Chrome avec `tools/verify-responsive-browser.mjs` : 13 images, 4 actions visibles, J’aime activable/désactivable, panneau commentaire et envoi local avec avis de non-publication; catering responsive à 320/390/768/1440 px. Captures dans `docs/visual-evidence/`. Likes et commentaires ne sont pas persistés côté serveur.
## Mise à jour — service-booking et feed de références

- La QA responsive ciblée tools/verify-responsive-browser.mjs a passé les viewports 320/390/768/1440 px pour service-booking; captures archivées dans docs/visual-evidence/.
- Le feed de l’accueil expose onze références; les quatre actions et les interactions locales du like/commentaire sont couvertes par le contrôle navigateur ciblé. Aucune vidéo publiée, interaction sociale persistée ou réservation réelle n’est affirmée.
- Ces éléments ne constituent pas un test E2E du moteur de réservation ni une preuve de pixel-match de la référence.

## Mise ? jour ? feed image-first et beauty

- Le feed d?accueil affiche huit images de r?f?rence dans un d?filement vertical par ?cran, avec J?aime, commentaire local, partage et personnalisation. Le shell d?accueil n?ajoute pas d?ancien header ou footer.
- QA navigateur du feed ? 320/390/1440 px et de beauty/service-booking ? 320/390/768/1440 px; captures dans `docs/visual-evidence/`.
- Beauty utilise une image de r?f?rence, des m?dias WebP et un rendu HTML/CSS d?di?. Le rendez-vous r?el, la persistance sociale et la publication vid?o ne sont pas connect?s; le pixel-match reste ? terminer.

## Portfolio image-first

- Reference: `apps/public-web/public/media/references/portfolio-reference-v1.png` (956x1646), variante WebP et medias derives sous `apps/public-web/public/media/portfolio/`.
- Le profil portfolio utilise son rendu HTML/CSS et apparait dans le feed et la galerie. QA portfolio passee aux viewports 320/390/768/1440 px; treize images verifiees dans le feed; pixel-match exact a finir.

## Build isole portfolio

- Public-web, admin-web et sites-runtime ont construit avec `SST_NEXT_DIST_DIR=.next-portfolio-check`, en pr?servant les dossiers `.next` du serveur local. Les 77 routes public-web ont ?t? pr?-rendues.

## Agency image-first

- Reference: `apps/public-web/public/media/references/agency-reference-v1.png` (951x1653), variante WebP et cinq crops sous `apps/public-web/public/media/agency/`.
- Le rendu LIGNE 09 est present au preview, au feed et a la galerie. QA 320/390/768/1440 px passee; capture desktop 742x1318 vs reference normalisee 1289 px (+2.3%). Pixel-match exact a finir.

## Craftspeople image-first

- Reference `craftspeople-reference-v1.png` (951x1653), variante WebP et douze crops incluant les icones de procedes.
- Template Atelier Tiko QA 320/390/768/1440 px; capture 742x1291 face a une reference normalisee de 1289 px. Le pixel-match exact n?est pas encore valide.

## Build public craftspeople

- Le workspace public a compile et pre-rendu 77 routes dans `.next-craftspeople-check`; output temporaire nettoye et `tsconfig.json` ramene a `.next`. `localhost:3010` renvoie HTTP 200.

## Events image-first

- Reference `events-reference-v1.png` (951x1653), variante WebP et six crops sous `apps/public-web/public/media/events/`.
- Rasin & Rythmes QA 320/390/768/1440 px; capture desktop 742x1273 vs reference normalisee 1290 px (-1.3%). Dates, lieu, horaires et inscription reelle restent des placeholders.


## Ticketing image-first

- Reference ticketing-reference-v1.png (941x1672), photo hero ticketing-hero-photo-v1.png, variante WebP et huit crops sous apps/public-web/public/media/ticketing/.
- NOUVEL VAG est integre au feed, a la galerie et au rendu HTML/CSS. Le questionnaire demande des precisions differentes pour entree generale, places/categories et pass. Prix, dates, ouverture, stock et checkout demeurent inactifs. QA Chrome passee a 320/390/768/1440 px; aucun overflow et focus du wizard verifie. Capture desktop 742x1318 vs reference normalisee 1317 px (+0,1%); pixel-match detaille a finir.

## Immobilier et feed — 2026-10-14

- Référence HABITAT NOU : PNG 940×1672, variante WebP, photo hero séparée et sept images WebP de contenu.
- Questionnaire immobilier version 1.8.0 : 26 définitions, dont trois branches conditionnelles selon maison/appartement, terrain ou local commercial; pas de prix/adresse/disponibilité inventés.
- `tools/verify-responsive-browser.mjs` exécuté sur `http://localhost:3010` : 14 slides et quatre actions du feed; J’aime toggle et commentaire local transparent; immobilier à 320/390/768/1440 px, aucun débordement horizontal et première question focalisée.
- Captures : `docs/visual-evidence/real-estate-{320,390,768,1440}px.png`, `home-feed-390px.png`, `home-feed-1440px.png`.

## Hôtellerie — MAISON CORAIL

- Référence `hospitality-reference-v1.png` (941×1672), hero distinct, variante WebP et dix crops sous `apps/public-web/public/media/hospitality/`.
- Rendu dédié ajouté au feed et à la galerie; questionnaire 1.9.0 avec trois questions conditionnelles selon le type de séjour. Tarifs, adresse et disponibilité restent à confirmer; aucune réservation ni paiement actif.
- QA Chrome 320/390/768/1440 px : aucun débordement horizontal; première question visible et focalisée. Feed : 15 images et quatre actions; J’aime et commentaire local vérifiés.
- Capture 1440 px : 742×1347 contre référence normalisée 742×1319,7 (+2,1%). Captures : `docs/visual-evidence/hospitality-{320,390,768,1440}px.png` et `home-feed-{390,1440}px.png`. Pixel-match des détails à poursuivre.
- Vérifications globales : `npm test` (134/134), ESLint public-web et typecheck des trois workspaces réussis. Build isolé tenté avec `.next-hospitality-check`; les workers Next.js se sont arrêtés sur épuisement mémoire. Le build antérieur à hospitality ne prouve pas le build courant.

## Tourisme — LAKOU ESCAPADES

- Référence image-first `tourism-reference-v1.png` (941×1672), photo hero séparée, variante WebP et neuf crops dérivés sous `apps/public-web/public/media/tourism/`.
- Rendu HTML/CSS dédié au feed et à la galerie; questionnaire 1.10.0 (26 questions) avec trois branches conditionnelles selon excursion, circuit ou expérience. Durées, tarifs, accès et rendez-vous à confirmer; aucune réservation active.
- QA Chrome 320/390/768/1440 px : aucun overflow; wizard ouvert avec focus sur la première question. Feed : 16 références et quatre actions; J’aime/commentaire local vérifiés.
- Capture desktop 742×1283 contre référence normalisée 742×1318,4 (-2,7%). Captures `docs/visual-evidence/tourism-{320,390,768,1440}px.png`, `home-feed-{390,1440}px.png`. Pixel-match détaillé à poursuivre.
- Vérifications globales : tests 134/134, lint public-web et typecheck trois workspaces passés. Build isolé après tourisme interrompu par épuisement mémoire des workers Next.js.

## Automobile — ROUTE NOIRE

- Référence image-first `vehicles-reference-v1.png` (941×1672), photo hero séparée, variante WebP et six crops dérivés sous `apps/public-web/public/media/vehicles/`.
- Rendu HTML/CSS dédié dans le feed et la galerie; questionnaire 1.11.0 (26 questions) avec trois branches selon vente, location ou entretien/essai. Prix, état et disponibilité sont à confirmer; aucune transaction automobile active.
- QA Chrome à 320/390/768 px passée sans overflow et avec focus du wizard. Le contrôle desktop 1440 px n’a pas terminé : worker Next/Turbopack interrompu sous pression mémoire. Captures mobile sous `docs/visual-evidence/vehicles-{320,390,768}px.png`; pixel-match desktop non vérifié.
- Vérifications globales : tests 134/134, lint public-web et typecheck trois workspaces passés. Build production isolé toujours bloqué par épuisement mémoire des workers.
- Capture du mockup à 1440 px : 742×1378; référence 940×1672 ramenée à 742 px : 742×1319,7, soit +4,4 % de hauteur. Le pixel-match de composition/typo n’est pas déclaré.
- Vérifications : `npm test` 134/134; lint public-web réussi; typecheck des trois workspaces réussi; build public-web isolé réussi avec 77 routes. Le catalogue publiable reste à zéro entrée.
