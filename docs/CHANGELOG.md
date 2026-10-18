## 2026-10-13 - Template ticketing
- Reference Nouvel Vag generee en image-first (941x1672), photo hero propre et huit crops WebP, rendu dedie ajoute au feed et a la galerie. Prix, dates et ouverture restent a confirmer; vente inactive.
- Questionnaire 1.7.0 avec questions conditionnelles selon le type de billet et migration additive des brouillons 1.6.0. QA Chrome 320/390/768/1440 px passee; capture desktop 742x1318 face a 1317 px normalises (+0,1%). Pixel-match detaille a finir.

## 2026-10-13 - Template events
- Reference image-first Rasin & Rythmes creee, six crops WebP, rendu dedie ajoute au feed et a la galerie. Dates et lieu explicitement a confirmer.
- QA responsive 320/390/768/1440 px passee; ecart de hauteur desktop -1.3% face a la reference normalisee.

## 2026-10-13 - Template craftspeople
- Reference Atelier Tiko creee en image-first, douze crops WebP dont quatre pictogrammes d?etapes, rendu dedie ajoute au feed et a la galerie.
- QA responsive passee aux quatre largeurs; hauteur desktop alignee a 0.2% de la reference normalisee. Restent le pixel-match et les details de texte.

## 2026-10-13 - Template agency
- Reference image-first LIGNE 09 generee (951x1653), variante WebP, cinq crops et rendu CSS responsive.
- Ajoute au preview, au feed et a la galerie; QA 320/390/768/1440 px passee. Pixel-match et details typographiques a finir.

## 2026-10-13 - Template portfolio
- Reference image-first Atelier Solenne generee et versionnee en PNG 956x1646, variante WebP et 11 crops WebP.
- Rendu portfolio responsive ajoute au preview, au feed et a la galerie. QA responsive et pixel-match a documenter.

## 2026-10-13 ? Feed TikTok et rendu beauty
- Accueil remplac? par un flux vertical d?images de r?f?rence plein ?cran, avec d?filement par ?cran et actions J?aime, commentaire local, partage et personnalisation; suppression du shell ?ditorial pr?c?dent.
- Le rendu beauty Maison Neroli, sa reference et ses medias WebP sont archives. Le feed contient douze references; reservation reelle et pixel-match restent a finir.

## 2026-10-13 — Rendu visuel service-booking
- Le suivi documente la référence service-booking-reference-v1.png, le rendu dédié Serein Studio, ses médias WebP et les captures responsive 320/390/768/1440 px.
- Le feed d’images contient neuf references. Le moteur de réservation reste non connecté et le pixel-match reste à terminer.

## 2026-10-12 — Workspace vérifié
- Le lockfile du workspace SST est généré sans référence externe. Résultats exécutés : 134/134 tests, lint et typecheck des trois applications, builds de production des trois applications et contrôle HTTP des 69 routes.
- Correctifs : prévisualisation des migrations, contraste WCAG, types de questionnaire, règles lint, navigation locale et catalogue UTF-8 sans BOM.
- Le site public tourne sur `http://127.0.0.1:3010`. La QA navigateur visuelle reste à faire.
- npm signale cinq vulnérabilités hautes; l'endpoint audit a échoué; aucun correctif automatique n'a été tenté.

## 2026-10-12 — Controle statique des profils sectoriels
- Ajout de `tools/verify-sector-profiles.ps1` pour comparer les IDs du registre aux 69 prompts sectoriels distincts, compter les 23 declarations et verifier les cinq flows d'apercu.
- Execution PowerShell reussie. Ce resultat ne remplace pas les tests Node, le build ou la QA navigateur.

## 2026-10-12 — Contraste du CTA des aperçus sectoriels
- Le CTA choisit maintenant automatiquement un texte sombre ou blanc selon le meilleur ratio avec la couleur de marque opaque.
- Le champ couleur n'accepte plus que #RGB et #RRGGBB. Deux tests source ajoutés; aucun test ni rendu navigateur exécuté faute de Node/npm et de navigateur.

## 2026-10-12 — Feed vide compact sur petits écrans
- Sous 640 px de hauteur et largeur, le feed vide supprime l’illustration décorative et réduit les marges pour faciliter l’accès au CTA vers les profils.
- Rendu et focus non vérifiés en navigateur.## 2026-10-12 — Parcours utile quand le catalogue vidéo est vide
- L’état vide du feed donne un lien vers les profils candidats et leurs questionnaires locaux, tout en indiquant qu’ils ne sont pas des templates métier publiés.
- Le catalogue reste sans démo vidéo réelle tant que médias et licences ne sont pas validés. Pas de QA navigateur exécutée.## 2026-10-12 — Contrat HTTP couvert sans framework
- Le handler HTTP (Content-Type, parsing, limite, statuts, headers no-store) est maintenant partagé en module pur entre Next et les tests.
- Deux tests source couvrent la réponse nominale et les rejets HTTP principaux. Total statique courant : 131 déclarations dans onze fichiers; aucune exécution faute de Node/npm.## 2026-10-12 — Contrat de validation testable sans Next
- Extraction du parseur borné et de la validation de requête dans un module pur partagé par l’API Next; cinq tests source couvrent les réponses nominales, branches masquées, versions et corps malformés/surdimensionnés.
- Total statique courant : 129 déclarations dans onze fichiers. Aucun test exécuté; le handler Next et le navigateur restent à valider.
## 2026-10-12 — Alignement des IDs client/serveur de validation
- Le clic de validation transmet maintenant les IDs de questions visibles, pas les clés remappées du rendu d’aperçu; le schéma serveur peut donc valider les mêmes réponses que le wizard.
- Correspondance contrôlée statiquement. Appel API réel et tests HTTP non exécutés.
## 2026-10-12 — Action explicite pour valider le brief côté serveur
- La relecture peut envoyer les réponses visibles à la route interne après un clic explicite et un avertissement clair; aucun envoi automatique ni stockage n’est effectué.
- Les erreurs renvoyées par le serveur permettent de retourner au champ concerné. Tests navigateur/API non exécutés.
## 2026-10-12 — Validation serveur des réponses questionnaire
- Route POST /api/questionnaire/validate : schéma résolu côté serveur, contrôle de version et validation des réponses; corps limité, réponses no-store sans persistance ni données saisies renvoyées.
- Le wizard ne l’appelle pas automatiquement afin de conserver l’engagement local-only. Pas de test d’intégration exécuté.

## 2026-10-12 — Progression exacte des réponses composites
- Les montants vides, valeurs textuelles blanches et objets/listes sans contenu ne comptent plus comme répondus; les conditions answered restent masquées jusqu’à une vraie valeur.
- Un test source ciblé a été ajouté. Total statique courant : 124 déclarations (121 public, 3 functions), dix fichiers. Test non exécuté faute de runtime.

## 2026-10-12 — Relecture complète du brouillon questionnaire
- Le résumé final énumère chaque question de la branche active, indique explicitement les réponses absentes et permet de revenir directement à chaque champ; les questions masquées restent exclues.
- Le bouton de reprise retourne à la première question. Mise à jour locale, aucun test/build/navigateur exécuté.

## 2026-10-12 — Aides et erreurs liées aux champs du wizard
- Les champs du wizard reçoivent maintenant les IDs d’aide et d’erreur via aria-describedby, et signalent un état invalide via aria-invalid sur les champs/groupes rendus.
- Cette amélioration P5 est uniquement inspectée statiquement; aucun contrôle clavier ou lecteur d’écran n’a été exécuté.

## 2026-10-12 — Libelles de sections adaptes aux secteurs, schema 1.6.0
- Les six IDs de sections restent stables; questionnaire et navigation de l'apercu utilisent maintenant les memes libelles contextualises par parcours et secteur.
- Les 69 questionnaires et manifestes passent en 1.6.0; les brouillons connus 1.0.0 a 1.5.0 restent migrables de facon additive.
- Quatre tests source ajoutes. Total statique observe : 123 declarations dans dix suites; tests non executes faute de runtime Node/npm.

# Journal des changements
## 2026-10-15 — Première version recentrée sur cinq modèles
- Priorité propriétaire : inscription en ligne, boutique mono-produit, boutique multi-produits, réservation en ligne et restaurant.
- Les autres rendus et les 52 profils sans rendu dédié sont conservés comme réserve. La référence ONG générée avant cette décision est archivée, sans rendu ni feed.
- QA navigateur véhicules et feed réussie à 320/390/768/1440 px après utilisation de localhost pour autoriser les ressources Next. Aucun déploiement, paiement réel ou changement Firebase/Vercel.
## 2026-10-12 — Paiements clients conditionnels, sans transaction
- Le questionnaire demande si le propriétaire veut encaisser ses propres clients, séparément de l’achat du template. Les questions d’usage restent masquées si la réponse est non.
- L’aperçu affiche la préférence uniquement si elle est activée et précise que SmartCut n’est pas connecté. Aucun prix, moyen de paiement, endpoint ou état financier n’est inventé.
- Schémas/manifests sectoriels en 1.4.0, 23 questions, 23 cibles uniques par profil; migration additive des versions connues 1.0.0 à 1.4.0.
- 106 déclarations de tests dans six suites, dont tests source sur la branche désactivée/activée; tous non exécutés faute de Node/npm.

## 2026-10-12 — Personnalisation des sections dans les aperçus locaux
- Ajout d’une question facultative de sélection des sections aux 56 questionnaires; les aperçus reflètent les sections choisies.
- Passage des manifestes et schémas sectoriels à 1.3.0; les brouillons 1.0.0, 1.1.0 et 1.2.0 sont acceptés par migration additive connue.
- Le catalogue de suivi reflète les 56 manifestes 1.3.0 et 21 questions par profil; total statique courant : 104 déclarations dans six suites.
- Les tests source couvrent l’assainissement de ce nouveau champ et son mapping vers la configuration; aucun test/build navigateur exécuté, Node/npm indisponibles.

## 2026-10-12 — Couverture de toutes les familles sectorielles du document maître
- Six fiches ont été ajoutées pour institutions/collectivités, industrie/B2B, services funéraires, sécurité, énergie/environnement et services publics.
- Registre, profils de questions conditionnelles, aperçus, garde-fous de routes/manifests et catalogue local couvrent maintenant 56 prototypes.
- Contrôle statique : 56 IDs uniques, 56 profils de questionnaire, 56 aperçus et 56 entrées de catalogue; aucune fiche sans profil ou aperçu.
- Aucun test, build ou rendu navigateur n’a été exécuté faute de Node/npm.

## 2026-10-12 — Rendu des types de questions universels
- Le wizard utilise un composant commun pour les types déclaratifs déjà définis : montant, multi-choix, date/heure, couleur, police, adresse, zone géographique, liste répétable, ordre et choix de sections en plus des champs de base.
- Les brouillons conservent les réponses composites en cours de saisie; les métadonnées de fichiers ne sont pas acceptées en localStorage.
- Les fichiers/images/logos restent bloqués jusqu’à la mise en place d’un endpoint sécurisé et d’une validation côté serveur. Un test de conservation des réponses composites a été ajouté; les tests restent non exécutés.
- Une question couleur de marque personnalise les aperçus des 56 secteurs. Les schémas et manifests passent à 1.2.0 avec migration additive depuis 1.1.0; chaque questionnaire compte 20 définitions.
- Inventaire local actuel : 85 fichiers visibles, dont 53 sous `apps/public-web`; 102 déclarations de test dans six suites, toutes non exécutées dans cette session.
- Les réponses déclarent maintenant leur `answerMapping` vers des clés stables de configuration; le moteur expose le mapping strict du questionnaire complet et le mapping local de brouillon visible utilisé par les aperçus.

## 2026-10-11 — Audit Phase 0 repris
- Lecture intégrale du prompt maître (1 738 lignes) et ajout de `docs/PHASE_0_AUDIT.md` avec inventaire, matrice P0, architecture cible, risques et décisions ouvertes.
- Remplacement de `STATUS.md` et `NEXT_TASK.md` pour refléter l'état vérifié : GitHub différé, services distants non vérifiés, gate P0 ouvert; P1 attend validation.
- Vérifications locales : parsing PowerShell de trois fichiers JSON réussi; 93 cas de test écrits recensés, aucun exécuté. Outils Node/npm/Git/CLI cloud absents.
- Scan heuristique non divulguant sur 73 fichiers : aucun marqueur de secret serveur; configuration Firebase Web uniquement dans le prompt maître, restrictions non vérifiées.
- Renforcement local de `.gitignore` pour configurations Firebase runtime, secrets Emulator, fichiers `.npmrc` locaux et keystores; `git check-ignore` reste indisponible faute de Git.
- Réalignement du résumé README sur la promesse SaaS multi-sectorielle; précision dans `DECISIONS.md` que l'arbitrage porte sur la réutilisation du code SST, pas sur un retour à l'architecture statique historique.
- Aucun code applicatif, dépôt distant, projet Firebase/Vercel, donnée ou déploiement modifié.

## 2026-10-11 — Contrôle audio dans le flux de légende
- Déplacé le bouton de son dans le panneau de légende pour éviter son chevauchement avec le texte sur mobile.
- Retiré le positionnement absolu du contrôle ; mise à jour du design system, du risque navigateur et du rapport P3.
- Revue JSX/CSS statique seulement ; pas d’essai navigateur.

## 2026-10-11 — Surface de contraste des légendes vidéo
- Ajout d’un panneau sombre semi-opaque derrière les légendes afin que le contraste dépende moins des images vidéo.
- Matrice et risque mis à jour ; aucune vidéo réelle ni capture disponible, vérification navigateur requise.

## 2026-10-11 — Séparation d’en-tête et ordre des cues WebVTT
- Validation d’une ligne vide après l’en-tête et d’horodatages de début en ordre non décroissant, conformément à la syntaxe W3C.
- Tests catalogue étendus pour l’en-tête sans séparation et les cues désordonnées. Total : 20 tests catalogue et 16 tests inscription, non exécutés.
- Source de référence ajoutée au rapport ; contrôle toujours partiel, pas un parseur complet.

## 2026-10-11 — Rejet des sous-titres WebVTT mal encodés
- Le validateur refuse maintenant les contenus décodés avec U+FFFD, symptôme d’octets invalides lors de la lecture UTF-8.
- Ajout d’une régression avec un octet invalide ; total : 19 tests catalogue et 16 tests inscription, toujours non exécutés.

## 2026-10-11 — Catalogue publié exigé en production
- Le validateur build refuse maintenant une production Vercel sans aucune entrée publiée ; catalogue vide toujours permis en développement et preview.
- Ajout d’une régression pour le différentiel local/production. Total : 18 tests catalogue et 16 tests inscription, aucun exécuté.
- Le garde-fou s’appuie sur `VERCEL_ENV`, documenté par Vercel comme `production`, `preview` ou `development`.

## 2026-10-11 — Bornes et ordre des cues WebVTT
- Validation des timestamps de sous-titres : plages minutes/secondes, sécurité numérique et fin strictement après le début.
- Ajout d’un cas couvrant horaires hors plage et cues inversées/égales. Total : 17 tests catalogue et 16 tests inscription, non exécutés.
- Le parseur reste partiel ; la lecture et la conformité WebVTT complète attendent un navigateur et une revue dédiée.

## 2026-10-11 — Vérification structurelle des sous-titres WebVTT
- Le validateur build exige un en-tête WEBVTT, une ligne de cue horodatée et du texte non vide pour chaque fichier captions référencé.
- Ajout de deux cas de test ; total : 16 tests catalogue et 16 tests inscription, tous non exécutés.
- Le contrôle ne remplace pas un parseur complet ni la revue des sous-titres dans un navigateur ; cette limite est documentée dans RISKS.md et le rapport P3.

## 2026-10-11 — Correction des libellés français du feed
- Corrigé les accents et la grammaire du message d’économie de données, de l’erreur de lecture et du pied de page catalogue.
- Vérification des chaînes dans le source UTF-8 ; rendu visuel et annonces lecteur d’écran non vérifiés.

## 2026-10-11 — Repli pour hauteurs viewport
- Ajout de replis `vh` lorsque `svh` n’est pas pris en charge, y compris pour les écrans courts.
- Corrigé l’état documentaire de la matrice responsive : le shell public existe, mais aucun viewport n’a été vérifié en navigateur.
- Revue statique seulement ; aucun test, typecheck, build ou essai navigateur.

## 2026-10-11 — Test du filtrage runtime des IDs
- Extrait l’exclusion des `templateId` dupliqués dans un module MJS partagé entre le catalogue runtime et la suite de tests.
- Ajout d’une régression vérifiant que tous les doublons sont retirés et qu’une entrée unique reste présente.
- Total : 14 tests catalogue et 16 tests inscription, tous non exécutés faute de Node.js/npm.

## 2026-10-11 — Catalogue runtime sans IDs ambigus
- Le filtre runtime exclut toutes les entrées valides ayant un `templateId` dupliqué, cohérent avec le rejet de build et les routes de détail.
- Mis à jour STATUS, DECISIONS, RISKS, NEXT_TASK et le rapport P3. La branche runtime n’a pas de test direct et n’a pas été exécutée.

## 2026-10-11 — Contrat de champs catalogue partagé
- Déplacé les listes de propriétés autorisées vers `content/catalog-schema.json`, importé par le runtime et lu par le validateur Node de build.
- Retiré le risque de divergence entre les deux copies de listes ; les valeurs et validations métier restent dans chaque chemin.
- Contrôle PowerShell du JSON seulement. Typecheck, tests et build non exécutés faute de Node/npm.

## 2026-10-11 — Schéma catalogue strict
- Validateurs build et runtime alignés pour refuser les propriétés inconnues du manifest, du secteur, de la démonstration et des droits médias.
- Ajout d’une régression à niveaux imbriqués ; total actuel : 13 tests catalogue et 16 tests d’inscription, tous non exécutés.
- Documenté le risque de dérive des deux listes d’autorisation et le contrôle à effectuer quand Node.js sera disponible.

## 2026-10-11 — Validation des fichiers média du catalogue
- Le validateur refuse maintenant les médias qui sont des dossiers ou des fichiers vides, après vérification du chemin réel et de son confinement.
- Ajout de deux tests catalogue ; total actuel : 12 tests catalogue et 16 tests d’inscription, tous non exécutés.
- Mise à jour du statut, des risques, du rapport P3 et de NEXT_TASK. La signature et le décodage des fichiers restent à contrôler avant publication.

## 2026-10-11 — Position de défilement après filtrage
- Le feed revient en haut et active la première entrée lorsque l’ensemble de résultats change.
- Mis à jour les notes de décision, statut, risque de vérification navigateur et prochaine tâche.
- Revue statique seulement ; navigateur et Node/npm indisponibles, aucun test/build exécuté.

## 2026-10-11 — Travail local, GitHub différé
- Mis à jour STATUS, DECISIONS, README et NEXT_TASK pour refléter la consigne actuelle : poursuivre dans le dossier local, ne pas créer/connecter GitHub maintenant.
- Ajout du risque de perte d’historique/versionnement local pendant le report de GitHub.
- Aucun accès distant, dépôt, service ou donnée modifié. Node/npm/Git indisponibles ; tests et build non exécutés.

## 2026-10-11 — Contrôle du catalogue sans action fictive
- Retrait du sélecteur de tri dont les options d’engagement n’étaient pas disponibles ; le catalogue garde son ordre chronologique fondé sur publishedAt.
- Documentation de la décision et du risque associé ; pas de métrique ni de collecte ajoutée.
- Revue statique seulement : Node/npm et navigateur absents, aucun test ni rendu exécuté.

## 2026-10-11 — Cadrage et audit GitHub en lecture seule
- Création initiale des 20 documents Phase 0.
- Inventaire local : seul le maître était présent ; aucun code/manifeste/config/Git observé.
- GitHub MCP a révélé le dépôt privé smartcutservices/smartcutservices et son sous-projet SST avec Cloud Functions/tests.
- Documenté l’écart entre existant statique intégré à SmartCut et cible Next.js/Vercel.
- Relevé configurations versionnées, branches non protégées et scripts/tests disponibles (non exécutés).
- Ajout du rapport REPOSITORY_AUDIT.md, portant le total à 21 documents.
- Aucun dépôt/service/donnée/déploiement modifié ; aucun test exécuté.
- P0 continue : mapping Firebase/Vercel, rôle du repo, contrat SmartCut et PoC restent ouverts.

## 2026-10-11 — Avancement complémentaire P0
- README et catalogue provisoire de 50 catégories candidates ajoutés ; périmètre MVP toujours non approuvé.
- Architecture : dépôt SST dédié choisi par le propriétaire ; comparaison de migration et entrées de budget ajoutées.
- Infrastructure : repères tarifaires officiels notés ; exigence Firebase Blaze pour Cloud Storage signalée, plan réel non vérifié.
- Sécurité : revue statique ciblée des règles Storage/Firestore et scénarios Emulator consignés ; aucun test exécuté, aucun changement distant.
- Paiements : achat SST et paiement final client séparés dans le registre API ; contrat externe/sandbox restent absents.
- GitHub : recherche installée ne trouve pas le dépôt dédié ; dépôt SmartCut a des droits push mais reste exclu de la destination.
- Gate P0 reste ouvert ; aucun déploiement, changement Firebase/Vercel ou transaction réelle.
- Premier scan heuristique des 24 fichiers présents avant ajout de `.gitignore` et `.env.example` ; résultat initial conservé dans la chronologie.
- Préparation du dépôt : `.gitignore` protège environnements locaux, clés privées, comptes de service et artefacts ; `.env.example` contient des placeholders publics de développement. Re-scan heuristique de 26 fichiers, aucun marqueur secret connu détecté hors de la clé Firebase Web déjà décrite.

- Reordered P10/P11 details, referenced existing candidate catalog, and moved execution status to the end of the plan.

- Démarrage local de `apps/public-web` : socle Next.js App Router/TypeScript, accueil responsive de découverte, catégories filtrables et favoris d’interface. Données et visuels de démonstration uniquement ; aucun service distant.

- Alignement video-first : remplacement des cartes de catalogue inventees par un feed vide explicite, aucune video/template/prix/connexion de demonstration. Suppression des URLs de compte et de contact non configurees.

- Ajout de tokens CSS sémantiques pour couleur, typographie, espacement, rayons, couches et mouvement ; la palette actuelle reste une proposition de prototype.

- Contrat catalogue ajouté : familles/secteurs/moteurs séparés, manifest JSON vide, validation au prebuild des IDs, secteurs approuvés, templates déployés, assets locaux et preuves de droits ; tests Node écrits mais non exécutés (Node/npm absents).
- Feed vidéo étendu pour réduire le préchargement, observer l’item visible, mettre en pause les autres/hors onglet, rester muet par défaut et respecter reduced motion ; commandes natives accessibles.

- Rapport P3 local ajouté : contrat catalogue et tests préparés, contrôles JSON confirmés, tests Node/build toujours non vérifiés faute d’exécutable.

- Recherche catalogue locale ajoutée au feed vidéo, avec état de recherche sans résultat.

- Tri chronologique du catalogue fondé sur publishedAt validé ; options populaires/activité désactivées sans signal réel.

- P3 vidéo : suppression de confiance du JSON au runtime, tri par date publiée vérifiée, traversal média refusé en build/runtime et mode data saver sans autoplay/préchargement.
- Feed vidéo focalisable au clavier et focus visible ajouté sur la région de défilement.

- Respect dynamique de prefers-reduced-motion dans la lecture vidéo.

- Détail vidéo partageable par ID avec metadata SEO/Open Graph et refus des modèles absents/non publiés.

- Familles du feed réalignées sur la section 3 V0.9 ; familles recommandées marquées proposées et publication interdite avant validation.

- Badge de marque corrigé à 4,92:1 et cibles tactiles/commandes principales portées à 44 px ; tokens documentés comme proposition.

- Nouvelle documentation de design system avec valeurs de tokens et ratios de contraste ; petites commandes/légendes ajustées pour la lisibilité.

- Canonical et Open Graph sécurisés par une origine publique HTTPS explicitement configurée ; aucune origine de production inventée.

- Contrat de configuration brouillon pour le module initial inscription : disponibilités, capacités, champs conditionnels, consentements, paiement décrit et politique upload.

- Contrat draft inscription enrichi de l identite publique, des regles capacite/attente/doublon, confirmation et validation stricte versionnee.
- Validation du contrat d'inscription renforcée : propriétés inconnues refusées dans les options de sélection et règles conditionnelles. Contrôle statique des lignes modifiées uniquement ; Node/npm absents, aucun test exécuté.
- La politique MIME du brouillon d'inscription est maintenant une liste positive limitée à PDF, JPEG, PNG et WebP ; la validation de contenu réelle, l'antivirus et le stockage sécurisé restent à implémenter côté serveur.
- Feed heading hierarchy corrected: one H1 labels the catalog, demo and empty-state titles use H2; static review only, no browser/build verification.
- Filtered demo count is now announced through a polite accessible status; screen-reader behavior remains unverified.
- Removed the overlapping empty-state live region so filtered results have one screen-reader announcement source.
- Catalog build validation now rejects an invalid `captionsSrc` whenever the optional property is present, matching the runtime filter.
- Clarified in STATUS.md that the owner-authorized local public shell is an exception and does not pass P0/P1 gates.
- Added catalog regression coverage for empty/null `captionsSrc`; nine catalog tests are authored and remain unexecuted.
- Published catalog entries now require non-empty rights evidence files; added a whitespace-only evidence regression test. License validity still requires human review.
- Rewrote README local setup: one Node.js 20.9+ install path, dev launch, and quality commands; clarified that the public shell starts without Firebase configuration.
- Added production-only SEO metadata, robots.txt and sitemap.xml generation for the public homepage and published demos; no origin configured, so deployment remains non-indexable.
- SEO follow-up: robots.txt now permits crawling of noindex previews while withholding the production sitemap/host, allowing crawlers to see noindex metadata.
- Deployment notes now require exposed Vercel system vars for production indexing and separate preview access protection.
- Hardened SEO origin gate so production indexing requires HTTPS independently of the development localhost parser exception.
- Added an SVG app icon via the Next.js app metadata convention; documented that its visual mark remains a prototype.
- Added a local French not-found page for unpublished demo IDs and unmatched public routes, with noindex metadata and return navigation.
- Added a public runtime error boundary with retry and catalog return actions; raw error detail is neither rendered nor logged.
- Added baseline security response headers for the public Next app; deferred CSP/HSTS pending runtime and production-domain verification.
- Added `global-error.tsx` to cover failures in the root layout, with standalone fallback markup and recovery actions.
- Added an accessible route loading fallback without animated motion.
- Documented that Next.js nonce-based CSP requires dynamic rendering and must be evaluated against feed caching/performance before adoption.
- Scoped the root error alert to its message while preserving the main landmark.
- Rewrote NEXT_TASK.md around the current public shell, route states, SEO/security, test counts, and remaining validation/gates.
- Public catalog search now ignores diacritics so unaccented mobile queries can match accented French/Creole terms.
- Added a keyboard skip link to bypass the public header and filters and reach the video feed.
- Public feed: applied CSS safe-area insets to the header, footer and video captions. Static review only; device/browser verification remains pending.
- Added a pure draft questionnaire engine for active-card progress, conditional answer invalidation, and client-side value checks; eight unit tests authored but not run because Node/npm are unavailable. Added an isolated accessible one-card UI primitive with no route or persistence; payment entitlement and server validation remain prerequisites before mounting it.
- Added the separate versioned universal questionnaire schema for all 21 declared field kinds, deterministic earlier-question visibility and required rules, stale-branch answer invalidation and local typed-answer validation; twenty-four tests authored, not run (no JS runtime). File checks and currency-specific amount bounds remain server-only; no persistence, answer mapping execution, permission enforcement, route or template integration.
- Added a pure questionnaire migration runner and read-only target-schema preview for version chains, explicit renames/option maps and answer quarantine with reasons. A review resolver now requires a retain/discard choice for each orphan, valid corrected answers and explicit human approval; it only returns a review result. Twenty-five tests authored, not run (no JS runtime). Deep answer copies isolate the source; non-JSON/cyclic values are rejected. No project/schema persistence, UI review or automatic migration.

- 2026-10-12 - Ajout local du catalogue de 50 templates sectoriels, de premières compositions de prévisualisation, désormais complétées par des contenus spécifiques aux 50 secteurs, et de questionnaires conditionnels dérivés du moteur commun. La galerie est liee depuis l accueil. Aucun paiement, stockage ni appel distant; verification statique seulement, runtime Node/npm absent.- 2026-10-12 - `generateStaticParams` now checks the exact count and uniqueness of 50 sector IDs and runs the shared questionnaire-schema validator for every sector before generating routes. Build execution is pending Node/npm.- Les fiches sectorielles exposent maintenant un titre, une description, une URL canonique et Open Graph derives des donnees de secteur. Elles heritent de la politique d indexation de la racine, qui reste fermee sans origine de production explicite.- La bibliotheque des 50 secteurs inclut une recherche insensible aux accents, des filtres par flux, un compteur annonce et un etat sans resultat avec reinitialisation.- 2026-10-12 - Prepare le protocole P0.8 multi-tenant (3 fixtures, placeholders 2 domaines, resolution host, cache/SEO/TLS et isolation). Non execute; aucun service ou domaine contacte.

## 2026-10-12 — Templates sectoriels et questionnaires dynamiques
- Ajout d’un profil de questions métier explicite et d’une branche « autre » pour chacun des 50 secteurs du registre.
- Chaque aperçu affiche désormais un titre, un appel à l’action et trois sections d’exemple propres à son secteur; les routes restent des maquettes locales.
- Le résumé du questionnaire permet de revenir à chaque réponse; la dernière étape mène explicitement à la relecture, y compris lorsque la note facultative reste vide.
- Contrôle statique : 50 secteurs, 50 profils de questionnaire, 50 profils d’aperçu, aucun ID manquant ou dupliqué, aucun marqueur d’encodage corrompu dans les deux fichiers modifiés. Pas de Node/npm disponible; build et rendu navigateur non vérifiés.
- Aucune réponse n’est sauvegardée ou envoyée. Pas de paiement, publication, moteur métier ou persistance activés.

## 2026-10-12 — Vérification des tarifs publics P0.7
- Actualisation d’`INFRASTRUCTURE.md` d’après les pages officielles Vercel Pro, Firebase pricing et Firebase Storage; exigence Blaze et quotas du bucket moderne consignés.
- Le plan, les régions, les domaines, l’usage et le compte réellement associé restent inconnus; aucun coût total n’est estimé et aucune facturation/service n’est modifié.
- `STATUS.md`, `DECISIONS.md`, `RISKS.md`, `PHASE_0_AUDIT.md` et `NEXT_TASK.md` précisent que les prix publics sont distincts du budget et des comptes réels.

## 2026-10-12 — Aperçu des templates relié aux réponses
- Le questionnaire de chaque secteur pilote maintenant l’aperçu affiché en parallèle : nom, offre, action principale, choix métier/détail et palette visuelle se mettent à jour sans envoi réseau.
- Les réponses restent en mémoire de page; ce raccord ne crée ni sauvegarde ni site publié.
- Aucun build/typecheck/navigateur exécuté (Node/npm absents).

## 2026-10-12 — Manifests sectoriels versionnés
- Ajout de `features/sectors/manifests.ts` : contrat ID/version/secteur/capacités/questionnaire/compatibilité/propriétés éditables/assets/aperçu/statuts et critères de publication manquants.
- Les 50 routes statiques sont désormais générées à partir des manifests; le garde build vérifie le compte, l’unicité/stabilité des IDs, la version, la référence questionnaire, la route et l’absence de fausse disponibilité publiée.
- Catalogue local enrichi des 50 IDs stables et de l’état de manifeste `1.0.0 - brouillon`.
- Manifests générés depuis le registre local : assets vides, catégories candidates, routes local-only, aucun prix ou statut publiable.
- Pas de build/typecheck (Node/npm absents); intégration admin, dépôt Git, médias/licences et publication restent à faire selon les gates P0/P1/P4/P11.## 2026-10-12 — Accessibilité clavier du wizard
- Le focus se déplace sur le titre à chaque changement de question et vers le titre du résumé à la fin; focus visible ajouté.
- Progression exposée comme barre `progressbar`; groupes de choix annoncés avec leur question; contrôles déclarent leur état requis et erreurs gardent `role=alert`.
- Contrôle de source seulement; navigation réelle au clavier, annonces d’un lecteur d’écran et conformité WCAG restent à vérifier sur navigateur.## 2026-10-12 — Règles de validation du questionnaire
- Les questions conditionnelles déclarent maintenant explicitement leurs dépendances en plus des règles de visibilité.
- Limites de saisie intégrées aux schémas et aux champs : texte court 120 caractères, courriel 254, téléphone 30, texte long 2 000. Le moteur partagé revalide les longueurs avant de continuer.
- Schémas versionnés; compilation du validateur et parcours réels non exécutés faute de Node/npm.## 2026-10-12 — Aperçu bureau/téléphone
- Ajout d’un contrôle accessible sur chaque fiche pour basculer entre la disposition bureau et le cadrage téléphone; les styles s’adaptent sans changer les réponses saisies.
- Les réponses sont isolées par ID de secteur via une clé de composant; naviguer vers un autre template ne réutilise pas son brief.
- Vérification de source/CSS seulement; aucune capture, session navigateur ou QA mobile/desktop n’a été réalisée.

## 2026-10-12 — Couverture des 50 templates et reprise des questionnaires
- Chaque secteur dispose d’un contenu d’aperçu dédié, d’un filtre direct dans le carrousel et d’un schéma de questionnaire versionné.
- Ajout des branches campagne/refonte, en plus des détails métier, du choix « Autre », de l’action, du site existant et du canal de contact conditionnels.
- Les réponses mettent l’aperçu à jour et sont reprises depuis sessionStorage dans l’onglet courant; le brouillon peut être effacé. Aucune donnée n’est envoyée au serveur.
- Restauration des textes français UTF-8 dans les fichiers sectoriels et le catalogue.
- Contrôle statique uniquement : aucun build, rendu navigateur, contrôle visuel/mobile ou essai lecteur d’écran dans cette session.

## 2026-10-12 — Réconciliation du statut avec le dépôt actuel
- Réécriture de STATUS.md comme snapshot des phases P0–P12, en distinguant aperçu local, prototype et fonctionnalités opérationnelles.
- Suppression des contradictions historiques sur le nombre de questions, la persistance du brouillon et la présence des applications; les détails de livraison restent dans les sections historiques du changelog.
- Aucun accès distant ou service n’a été modifié; les bloqueurs P0 demeurent ouverts.

## 2026-10-12 — Reprise persistante du wizard (P5 local)
- Autosave local debouncé avec flush à la fermeture de page; reprise après fermeture du navigateur sur le même profil.
- Avertissement navigateur tant qu’une réponse modifiée ou un conflit n’est pas sauvegardé/résolu.
- Les modifications multi-onglets sont comparées à la révision de base; un choix explicite évite les écrasements silencieux. Un tombstone sans réponses prévient la résurrection d’un brouillon effacé par un onglet ancien.
- Migration additive 1.0.0 → 1.1.0 conserve les réponses compatibles; les réponses devenues invisibles sont retirées. Un schéma inconnu est conservé sans écrasement et demande une action explicite.
- Les valeurs texte incomplètes restent récupérables; le wizard revient sur la première réponse invalide pour correction.
- Aucune donnée n’est envoyée au serveur. L’effacement est proposé; si le stockage navigateur échoue, l’interface le signale.
- Code relu statiquement uniquement; aucun build, test ou scénario navigateur n’a été exécuté.

## 2026-10-12 - Migration du brouillon de l ancienne version
- Les réponses brutes conservées dans sessionStorage par la version précédente sont reprises dans le nouveau brouillon persistant.
- La copie source est supprimée seulement après une sauvegarde locale réussie; un schéma ou une réponse inconnus restent intacts et exigent une décision explicite.
## 2026-10-12 — Extraction et tests unitaires P5
- Extraction des politiques de brouillon utilisées par React vers draft-policy.mjs avec contrat TypeScript .d.mts.
- Ajout de 6 tests ciblés; comptage total local : 99 tests source dans 6 suites.
- Aucun test n’a été exécuté : Node et 
ode_modules sont absents.
## 2026-10-12 — Rafraîchissement de l’inventaire P0.1
- Recompte de l’état local : 84 fichiers au total, 52 dans public-web; 99 tests source dans six suites.
- Distinction ajoutée entre les prototypes locaux autorisés et le gate P0 / le démarrage formel P1 toujours non approuvés.
- Le scan heuristique de 73 fichiers reste daté du 2026-10-11; il n’est pas présenté comme un rescannage du dépôt courant.

## 2026-10-12 — Stub interne SmartCut fail closed
- Ajout d'un port serveur local avec trois capacites inertes; chaque appel retourne une erreur non configuree, sans reseau ni chemin de succes.
- Ajout de declarations TypeScript et trois tests source. Aucun contrat externe, endpoint, secret ou payload SmartCut n'est invente.
- Total statique courant : 109 declarations de test dans huit suites; aucun test execute.
## 2026-10-12 — shells locaux admin et runtime
- Ajout de `apps/admin-web` et `apps/sites-runtime` avec configurations Next.js/TypeScript séparées.
- Les pages restent en état fermé : aucune lecture Firebase, authentification simulée, résolution de domaine, donnée tenant ou action d’administration.
- Aucun build, lint ou typecheck exécuté; Node/npm restent indisponibles dans l’environnement.
## 2026-10-12 — lier le questionnaire a l'apercu
- Ajout de `preview-copy.mjs` pour reprendre dans l'apercu les reponses campagne/refonte et les details de l'action.
- La question de details est maintenant adaptee au moteur sectoriel (commande, reservation, candidature ou contenu).
- Quatre declarations de test ajoutent les cas de priorite, reponse absente et reponse invalide. Tests non executes faute de Node/npm.
## 2026-10-12 — clarifier la galerie sectorielle
- Les nombres de profils affiches sont derives du registre de secteurs.
- Les libelles distinguent maintenant les profils candidats et apercus locaux des templates metier publies.
- La couverture fonctionnelle et les gates P11 restent incomplets.
## 2026-10-12 — config lint et lancement des shells P1
- Ajout d'une configuration ESLint Next.js autonome aux applications admin-web et sites-runtime.
- Ajout d'un README local par application avec commandes prevues et preconditions de securite.
- Lint, typecheck et build non executes; dependances non installees.
## 2026-10-12 — workspace frontend local
- Ajout d'un workspace npm racine pour public-web, admin-web et sites-runtime avec commandes distinctes de developpement et controles communs.
- Actualisation du README: 56 profils candidats, trois apps, commandes racine, absence de lockfile et configuration Vercel encore a faire.
- npm install/build non executes car Node/npm sont absents.
## 2026-10-12 — tests racine workspace complets
- `npm test` lance Node Test Runner depuis la racine pour decouvrir egalement les tests sous `functions/tests`.
- Ajout de commandes ciblees `test:public` et `test:functions`.
- Aucun test execute car Node/npm sont absents.
## 2026-10-12 — extension des profils candidats P0.7
- Ajout de 11 secteurs absents de la liste initiale: universités, cafés/snacks, centres médicaux, pharmacies, bijoux/luxe, électronique, éducation artistique, impression personnalisée, freelances, support et petites annonces.
- Chaque ID possède une entrée de registre, un profil de questions propre et un contenu d’aperçu spécifique; manifestes toujours en brouillon.
- Garde de génération statique mise à jour de 56 à 67; contrôles non exécutés faute de Node/npm.
## 2026-10-12 — deux profils P0.7 supplémentaires
- Ajout d’épiceries et marchés, puis petites entreprises locales, avec ID, questions sectorielles et contenu d’aperçu dédié.
- Garde du registre mise à jour à 69. Les 69 profils restent des brouillons candidats.
## 2026-10-12 — guidance de paiement sectorielle, schéma 1.5.0
- Ajout d’un texte d’aide contextuel par famille, avec garde-fous supplémentaires pour billetterie, dons, santé, pharmacie, produits numériques et SaaS.
- IDs des réponses et options existants conservés; version des 69 questionnaires/manifests passée à 1.5.0.
- Migration additive de brouillons 1.0.0–1.4.0 vers 1.5.0; six tests source ajoutés, non exécutés.
## 2026-10-12 — cartes de sélection des sections
- La question `included-sections` affiche des cartes descriptives et un état sélectionné, avec focus visible et une colonne sous 480 px.
- Les IDs existants sont conservés pour les brouillons. Aucun contrôle navigateur n’a été exécuté.

## 2026-10-12 — compositions d’aperçu par moteur
- Les aperçus utilisent une composition distincte pour chacun des cinq moteurs déclarés (commande, réservation, candidature, contenu, vitrine/contact), avec dispositions desktop et mobile adaptées.
- Le texte continue à venir du profil candidat et des réponses locales. Aucune commande, réservation, candidature ou publication réelle n’est connectée; QA navigateur et build non exécutés.

## 2026-10-12 — avertir avant suppression d’une branche
- Ajout de `countDiscardedAnsweredQuestions` pour compter les réponses significatives retirées du brouillon actif, y compris les clés de question obsolètes.
- Le wizard affiche un message accessible avec une action d’annulation qui restaure le brouillon antérieur; les champs blancs et listes vides ne comptent pas.
- Un test source couvre le comptage nominal et le champ blanc. Total statique : 132 déclarations dans onze fichiers. Aucun test/build/navigateur exécuté, Node/npm absents.

## 2026-10-12 — navigation clavier du feed
- Ajout de commandes précédente/suivante dans chaque fiche de démonstration, avec limites désactivées aux extrémités du filtre actif.
- Les commandes sont accessibles au clavier, possèdent des noms accessibles et respectent `prefers-reduced-motion`; le scroll et le swipe natifs restent inchangés.
- Vérification source seulement; aucune démo publiée ni QA navigateur disponible.

## 2026-10-12 — contrôle reproductible de contraste
- Ajout de `tools/verify-contrast.ps1`, vérificateur PowerShell sans dépendances pour 21 paires opaques feed/wizard/aperçus.
- Exécution locale : 21/21 au-dessus de 4,5:1; ajout des ratios et limites dans le design system et le plan QA.
- Transparences, médias réels, focus/bordures et audit navigateur/lecteur d’écran restent non vérifiés.
## 2026-10-12 — Workspace exécutable et profils vérifiés
- Création du lockfile npm isolé au workspace SST; scripts Next utilisent Webpack pour éviter la résolution de liens externes.
- Correctifs détectés par les contrôles : champs complets dans les aperçus de migration, contraste noir/blanc conforme WCAG AA, types du wizard, liens Next, progression du feed et catalogue UTF-8 sans BOM.
- Résultats réellement exécutés : 134 tests réussis; lint, typecheck et build réussis pour les trois apps; 69 routes locales HTTP 200.
- Le serveur public reste sur `http://127.0.0.1:3010`. L'audit visuel navigateur n'est pas terminé.
- npm signale cinq vulnérabilités hautes; le service d'audit du registre est inaccessible, donc aucun avis n'a été confirmé et aucun correctif automatique n'a été lancé.

## 2026-10-12 — Directive image-first et référence scolaire
- Formalisation du workflow demandé : générer une référence idéale avant le rendu, implémenter le template au plus près, capturer les mêmes viewports et créer les médias/icônes spécifiques requis.
- Une affiche scolaire fixe est affichée sur l’accueil tant que le catalogue n’a pas de vidéo; elle est explicitement décrite comme référence visuelle et non comme démo publiée.
- Référence générée : `apps/public-web/public/media/references/school-enrollment-reference-v1.png`. Le template HTML/CSS scolaire pixel-matched reste à implémenter.
- Première implémentation HTML/CSS du candidat école : hero, parcours illustrés, étapes d’admission, vie scolaire, visite et navigation, avec quatre cadrages photo générés depuis une planche dédiée. Comparaison navigateur initiale effectuée; les espacements et l’échelle typographique demandent encore des ajustements avant validation fidèle.

## 2026-10-12 — rendu formation et couverture image-first
- Référence du profil formations générée avant son rendu; page dédiée (hero, parcours, méthode, séances, contact), photos générées et identité SVG intégrées. Les dates restent à confirmer et le calendrier ne fait aucune promesse de réservation.
- Les profils éducation et formation adaptent les sections à `included-sections`; l’encaissement client reste absent et est explicitement marqué non configuré.
- Matrice des 69 profils créée; références/rendus image-first en brouillon pour éducation et formation, autres profils suivis comme restant à faire.
- Vérifications : 134 tests, lint, typecheck, build public-web réussis; matrice responsive complète réussie.
# 2026-10-12 — Références et rendus commerce mono/multi-produit
- Généré et intégré les visuels de référence et de contenu du template multi-produits avant son HTML/CSS; la galerie reproduit quatre collections, une sélection et un bloc newsletter désactivé jusqu’à connexion. Aucun vrai panier, stock, prix ou encaissement n’est revendiqué.
- Ajouté le rendu dédié mono-produit, son sac et ses photos de contenu accordés à la référence, avec atelier, matières, FAQ et prix/disponibilité à confirmer. Les captures Chrome ont servi aux itérations visuelles.
- Enregistré la procédure « image d’abord » dans `AGENTS.md`; localhost sert les routes. Tests, lint, types, build et QA responsive Chrome passent; le pixel-match reste à faire.
- Ajouté `tools/optimize-static-media.mjs` / `npm run media:optimize`; neuf planches de contenu sont livrées en WebP avec des sources originales préservées. Réduction mesurée : 90–93 %.

## 2026-10-12 — Référence image-first restaurants
- Créé la référence idéale Lakou et ses planches photo menu, hero et salle; affichage de la référence dans la galerie en l'absence de démo vidéo.
- Remplacé le rendu générique par une page dédiée restaurant, responsive, avec prix, adresse, horaires et réservation à confirmer. Les commandes/paiements restent inactifs.
- QA Chrome 320/390/768/1440 px et captures; les écarts de proportions par rapport à la référence restent suivis. Médias convertis en WebP.


## 2026-10-12 — Flux d’accueil image-first et profil traiteur
- Remplacement de l’accueil vidéo vide par un flux vertical à défilement magnétique, une référence visuelle par écran et actions J’aime, commentaire local, partage navigateur et personnalisation. L’ancien header/footer a été retiré; aucune image n’est présentée comme démo vidéo.
- Création du rendu Maison Safran depuis sa référence générée, photos dédiées optimisées en WebP, parcours de devis sans prix ni coordonnées inventés.
- QA Chrome : six slides, quatre actions visibles, toggle J’aime et commentaire local vérifiés; captures accueil 390/1440 et traiteur 320/390/768/1440 dans `docs/visual-evidence`.
## 2026-10-14 — Template immobilier et feed d’images
- Référence HABITAT NOU générée avant le rendu (940×1672), photo hero dédiée et sept crops WebP; rendu HTML/CSS dédié et questionnaire 1.8.0 avec trois branches conditionnelles.
- QA Chrome du profil aux largeurs 320/390/768/1440 px et du feed (14 références, quatre actions); tests 134/134, lint public-web, typecheck 3 workspaces et build public-web isolé (77 routes) réussis.
- Rendu desktop immobilier 742×1378 contre 742×1319,7 normalisés (+4,4 %); pixel-match détaillé non terminé. Le catalogue reste brouillon, sans annonces ni transactions opérationnelles.
- Mise en scène du feed affinée : références nettes sur fond uni, une slide par écran, gestes d’action plus visibles, sans header/footer éditorial.

## 2026-10-14 — Template hôtelier et feed vertical
- Génération image-first de MAISON CORAIL (référence 941×1672, hero séparé et dix médias dérivés), puis rendu HTML/CSS dédié dans la galerie et le feed vertical.
- Questionnaire hospitality version 1.9.0 : 26 questions déclarées avec trois branches conditionnelles selon le type de séjour; aucune réservation ni aucun paiement n’est activé.
- QA responsive effectuée à 320/390/768/1440 px; feed à 15 références et quatre actions. Capture desktop +2,1% de hauteur par rapport à la référence normalisée; pixel-match détaillé à poursuivre.

## 2026-10-14 — Référence et rendu tourisme

- Génération image-first de LAKOU ESCAPADES (941×1672), neuf crops et hero WebP; référence ajoutée au feed et à la galerie.
- Rendu HTML/CSS dédié et questionnaire version 1.10.0 avec trois branches d’excursion; parcours et prix à confirmer, aucune réservation activée.
- QA Chrome 320/390/768/1440 px passée; feed 16 slides et quatre actions. Capture desktop 742×1283 vs cible normalisée 742×1318,4 (-2,7%). Tests 134/134, lint public-web et typecheck trois workspaces passés; build isolé à refaire après épuisement mémoire des workers Next.js.

## 2026-10-15 — Profil automobile ROUTE NOIRE

- Référence image-first 941×1672, photo hero séparée, six crops WebP, rendu HTML/CSS et questionnaire 1.11.0 (26 questions, trois branches vente/location/entretien) ajoutés au feed et à la galerie.
- Feed à 17 références; contrôle responsive véhicules passé à 320/390/768 px. QA desktop 1440 px et pixel-match restent ouverts après erreurs des workers mémoire.
- Tests 134/134, lint public-web et typecheck trois workspaces passés; build isolé échoue encore sous pression mémoire.


## 2026-10-15 — Première version recentrée sur cinq modèles
- Priorité propriétaire : inscription en ligne, boutique mono-produit, boutique multi-produits, réservation en ligne et restaurant.
- Les autres rendus et les 52 profils sans rendu dédié sont conservés comme réserve. La référence ONG générée avant cette décision est archivée, sans rendu ni feed.
- QA navigateur véhicules et feed réussie à 320/390/768/1440 px après utilisation de localhost pour autoriser les ressources Next. Aucun déploiement, paiement réel ou changement Firebase/Vercel.

## 2026-10-15 — Feed de première version
- Le feed d’accueil présente maintenant uniquement les cinq modèles prioritaires. Les 12 autres aperçus et profils restent dans le projet comme réserve.
- QA navigateur : 5 slides, quatre actions et interaction locale vérifiées; inscription/education passée sur 320/390/768/1440 px sans débordement, focus actif vérifié.


### Édition directe des modèles — 2026-10-15
Le questionnaire n’est plus présenté comme le parcours principal sur les pages de modèles. L’éditeur local permet d’éditer directement les textes, remplacer les images et logos, modifier les destinations de liens avec une liste de protocoles autorisés, et ajouter, réordonner, masquer ou réafficher les sections. Les textes/liens sont stockés dans localStorage et images/structure dans IndexedDB. Chrome confirme sur les cinq modèles prioritaires l’édition/restauration de texte, le remplacement/restauration d’une photo et du logo, l’édition locale d’un lien, le choix et la persistance de couleur principale, l’ajout/réordonnancement/masquage/réaffichage d’une section et la persistance après rechargement; profils et feed passent à 320/390/768/1440 px sans débordement. Ce prototype n’a ni compte, ni stockage serveur, ni publication; les 12 modèles de réserve restent à valider.

L’historique Annuler/Rétablir est ajouté pour les textes, champs, textes alternatifs, liens, images, couleur et changements de structure. La QA Chrome vérifie l’aller-retour du texte et de l’alt sur les cinq modèles prioritaires, ainsi que le champ newsletter sur multi-produits; les brouillons persistent au rechargement. La QA responsive du feed et des cinq modèles passe; ESLint ciblé et TypeScript passent. Les historiques des liens, images, couleur et structure restent à vérifier explicitement.

### Édition directe — QA et historique — 2026-10-15
- Repérage des textes, liens, champs, logos et visuels dans les rendus; les sections ajoutées restent éditables.
- Stabilisation de la QA avec l’hôte `localhost` pour la connexion HMR Next.js.
- Correction de l’ajout de section pendant la sauvegarde et capture de l’état « après » à partir du brouillon IndexedDB, pour préserver l’annulation/rétablissement après réconciliation React.
- QA Chrome renforcée réussie sur les cinq modèles prioritaires et le feed à 320/390/768/1440 px, sans débordement; Annuler/Rétablir du texte, formulaire, alt, lien, photo, couleur et structure vérifiés; remplacement de logo et persistance locale confirmés.
- ESLint ciblé et typecheck public-web réussis. Aucun build complet ni changement Firebase/Vercel dans ce lot.

### QA des 12 rendus conservés — 2026-10-15
- QA navigateur réussie pour training, beauty, vehicles, tourism, hospitality, real-estate, ticketing, events, craftspeople, agency, portfolio et catering.
- Flux d’édition directe, Annuler/Rétablir, persistance locale et absence de débordement vérifiés à 320/390/768/1440 px. Le feed garde ses 17 références; les 12 rendus restent hors priorité MVP.
- Le contrôle attend une transaction IndexedDB de lecture après le remplacement d’image pour ne pas chevaucher la sauvegarde du texte alternatif.

### Fondations locales Firebase Auth — 2026-10-15
- Ajout d’un compte de développement qui cible uniquement le projet démo `demo-smartsolutiontek` et l’émulateur Auth local; toute configuration cloud ou partagée est refusée par défaut.
- CLI Firebase 15.34.0 lancée sans dépendance permanente du dépôt; cache, JRE, profil et fichiers temporaires confinés à `.tools/`.
- Ajout du parcours local inscription, connexion, réinitialisation, vérification d’adresse et déconnexion. Aucun Firestore, Storage, projet partagé ou donnée de production n’est connecté.
- Preuves de cette reprise : Auth emulator prêt sur 9099, interface sur 4000; création puis suppression d’un compte fictif réussie; `/`, `/account` et `/templates/education` répondent HTTP 200; 143/143 tests et typecheck public-web réussis.
- ESLint public-web et typecheck des trois workspaces passent. La commande distante en lecture seule `firebase projects:list` n’a pas d’authentification CLI et n’a retourné aucun inventaire.
- `LOCAL_STATE_REVALIDATION_2026-10-15.md` réconcilie les audits historiques qui décrivaient un état antérieur du dépôt. P0 reste ouvert.
# 2026-10-15 — Parcours d’édition visuelle directe
- Le catalogue présente le choix d’un modèle suivi de l’édition dans l’aperçu; ses libellés ne mettent plus le questionnaire au premier plan.
- L’action du feed est libellée « Éditer » et ouvre l’aperçu du modèle.
- La fiche explique les modifications disponibles dans l’aperçu et précise que le brouillon reste local.
- Enregistré dans `docs/DECISIONS.md` : la nouvelle direction du propriétaire remplace l’ancien questionnaire comme parcours principal. Les questionnaires peuvent rester facultatifs pour les données métier.

### 2026-10-15 — Brouillons de l’éditeur dans Firebase Emulator
- Connexion facultative de l’éditeur direct aux émulateurs locaux Firestore et Storage pour sauvegarder/charger un brouillon du compte; l’édition locale reste utilisable sans session.
- Ajout des règles Storage à portée propriétaire et de trois tests dédiés, en plus des huit cas Firestore. Aucun déploiement ou changement distant.

### 2026-10-15 — QA navigateur de sauvegarde de compte
- Ajout de `tools/verify-account-draft-browser.mjs` et `npm run qa:account-draft` pour vérifier inscription Emulator, édition de texte/image, enregistrement Firestore/Storage, actualisation, restauration explicite et suppression confirmée des images et du document brouillon.
- Le parcours est passé dans Chrome headless. Le compte fictif et son brouillon demeurent confinés aux émulateurs locaux; P0 et le déploiement restent ouverts.


### Recentrage de la page modèle et amorce de P2 — 2026-10-15
- Fiche modèle : aperçu élargi et mis au centre, commandes de vue ordinateur/téléphone rapprochées du canvas, suppression du panneau d’explication latéral.
- Règles Firestore locales : création atomique projet + membership propriétaire au UID de l’utilisateur, permissions initiales limitées à lecture/édition, sans création de membres supplémentaires.
- Huit tests Firebase Emulator réussissent, y compris les lots incomplets et les tentatives d’élévation. Aucun déploiement distant ni synchronisation de l’éditeur n’a été effectué.- Contrôles de reprise : 143/143 tests unitaires, 8/8 tests de règles Emulator, typecheck des trois workspaces; catalogue publié vide comme prévu.

## 2026-10-16 - Suppression de compte de demonstration
- Ajoute le callable demo-only `deleteDemoAccount`, sa validation de propriété multi-projet, et le flux explicite de réauthentification/confirmation dans `/account`.
- Etend le banc navigateur au parcours de suppression et verifie l'absence du compte dans Auth Emulator.
- Validation : `node --test` 155/155, Functions 12/12, typecheck public-web, ESLint cible et E2E compte/draft passes.
- Limite : le test E2E supprime d'abord le projet; il faut encore couvrir le callable de compte avec projet/media presents. Export, retention et deploiement restent ouverts.

## 2026-10-16 - Preuve E2E suppression complete
- La QA de compte verifie que des objets Storage et un projet Firestore existent avant suppression, puis que le prefix Storage UID est vide, le projet renvoie 404 et l'ancien mot de passe ne peut pas rouvrir une session.
- Le panneau compte conserve un message de succes apres deconnexion et indique le nombre de projets effaces.
- Cette preuve utilise uniquement `demo-smartsolutiontek` et ses emulators.
