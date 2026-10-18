# Registre des risques — 2026-10-11
| ID | Risque | Niveau | Réduction |
|---|---|---|---|
| R1 | SST est intégré à un dépôt SmartCut et pourrait partager Firebase | Critique | Mapping/production non prouvés ; confirmer en lecture seule, aucun déploiement avant diff |
| R2 | Réutiliser le paiement actuel peut confondre les internes MonCash et l’API SmartCut visée | Critique | Définir le contrat externe et l’emplacement des secrets ; aucun endpoint supposé |
| R3 | Contrat légal de fonds tiers, soldes et retraits inconnu | Critique | Bloque la finance ; contrat, KYC/AML et revue juridique |
| R4 | Architecture existante statique + Functions diffère de la cible Next.js/Vercel | Élevé | Confirmer prototype/staging/production ; décider transition avant Phase 1 |
| R5 | Routage tenant/domain/SEO/cache Vercel non prouvé | Élevé | PoC isolé 3 tenants/2 domaines |
| R6 | Branches GitHub non protégées et aucun workflow GitHub observé | Élevé | Évaluer protections/CI ; ne rien modifier avant arbitrage |
| R7 | Coûts/quotas Firebase/Vercel/vidéo inconnus ; repo volumineux | Élevé | Budget, alertes, politique média avant architecture |
| R8 | Chaque catégorie approuvée requiert un template fonctionnel | Élevé | Approuver taxonomie/MVP ; moteurs communs en premier |
| R9 | Données, juridictions et rétention inconnues | Élevé | Cartographier, minimiser, revue légale |
| R10 | CLI locales absentes et aucun outil GitHub de création de dépôt ; le connecteur peut écrire dans des dépôts existants | Moyen | Ne pas écrire dans SmartCut ; créer la cible dédiée et vérifier les permissions avant tout push |
| R11 | Le bucket déclaré *.firebasestorage.app exige Blaze pour Cloud Storage; les quotas sans frais subsistent, mais l’usage excédentaire peut être facturé et le plan réel est inconnu | Critique | Tarifs publics vérifiés dans INFRASTRUCTURE.md le 2026-10-12; confirmer le projet/plan en lecture seule, estimer par région et valider le budget avant toute liaison Billing; aucune activation automatique |
| R12 | Les pièces jointes `sst-form-uploads` sont lisibles publiquement dans storage.rules ; le fallback public ne les exclut pas | Élevé | Déterminer la sensibilité attendue ; revue Emulator et déploiement ; stratégie privée/signée et exclusion avant réutilisation |
| R13 | Branding shops/food/services/forms peut être écrit par tout utilisateur authentifié sans contrôle d’appartenance tenant visible | Élevé | Tests cross-tenant Emulator ; vérifier propriétaire des chemins ; resserrer avant réutilisation, sans toucher au projet actif |
| R14 | Les quatre previews spécialisées n’ont pas toutes une comparaison visuelle documentée; commerce mono/multi vient d’être ajouté et la galerie utilise des images de référence | Élevé | Capturer les mêmes viewports que les références, corriger l’écart; distinguer poster/image de démo vidéo publiée |

## Comportement financier existant, non approuvé
Le code consulté contient un minimum de versement de 500 HTG et un versement manuel. Ce sont des comportements du dépôt, pas des règles produit validées.


## Risques supplementaires du frontend local
| ID | Risque | Niveau | Reduction |
|---|---|---|---|
| R14 | Le feed public ne contient aucune démonstration réelle ; la découverte vidéo-first et la validation P3 ne sont pas atteintes | Élevé | Le build Vercel de production est désormais bloqué sans entrée publiée ; ajouter uniquement des vidéos/templates approuvés puis vérifier médias, droits, poids et parcours avant publication |
| R15 | Les contrats et interfaces locaux n'ont pas encore de validation executable ; les outils Node/npm et Git manquent dans la session | Eleve | Installer les outils dans l'environnement de travail autorise ou faire executer les commandes dans un environnement equipe ; ne pas declarer les gates passes avant preuves |
| R16 | La liste MIME locale limite la configuration mais ne prouve pas le contenu du fichier reçu | Critique avant toute collecte | Imposer validation serveur par signature, limites de taille, antivirus si retenu, accès tenant privé et suppression/retention avant d'activer les téléversements |
| R17 | Preview `noindex`/robots directives do not prevent direct access or guarantee search removal; deployment protection and search behavior are unverified | Eleve | Configure Vercel preview protection separately; verify production metadata and preview access before publishing or connecting a domain |
| R18 | Prototype app icon could be mistaken for approved company branding | Moyen | Owner review or replacement before production; visual identity remains explicitly provisional |
| R19 | Public route states, caption/audio-control layout, caption contrast, viewport-unit fallback, result-reset behavior, and keyboard navigation are not browser-tested; duplicate-ID regression tests remain unexecuted | Moyen | Verify sound-control separation, caption readability over real clips, loading/retry/skip-link focus, short viewport heights and vh/svh behavior, duplicate-ID catalog/sitemap behavior, filter changes at a scrolled position, accessibility, HTTP status, and metadata in a running preview |
| R20 | CSP/HSTS are not configured and security headers are not verified on responses; nonce CSP may require dynamic rendering and affect caching | Eleve | Evaluate the Next nonce/CSP strategy against static caching and inline UI; add HSTS only after domain scope is approved; inspect deployed headers |
| R21 | Le catalogue n’a pas de métriques d’engagement validées pour classer les démonstrations par popularité | Faible | Ne pas afficher de tri populaire avant collecte autorisée, définition des métriques et contrôles de confidentialité ; conserver le tri chronologique |
| R22 | Le dossier local n’a pas d’historique Git ni de dépôt distant ; GitHub est différé et Git n’est pas disponible dans la session | Moyen | Conserver le dossier source autorisé sans opération distante ; créer l’historique et la sauvegarde versionnée lorsque le propriétaire reprendra explicitement ce volet |
| R23 | Le validateur confirme l’existence, l’extension et la taille non nulle des médias, pas leur signature, décodage ni intégrité ; le contrôle VTT est partiel et ne parse pas toute la spécification | Moyen | Avant publication, inspecter les vrais fichiers avec des outils média, valider complètement le WebVTT et vérifier la lecture/captions dans les navigateurs/appareils ciblés ; ne pas traiter le contrôle de manifeste comme une preuve de média valide |

| R24 | Le moteur questionnaire local n’est qu’une logique pure côté client ; il ne sauvegarde rien et ne peut sécuriser ni soumettre des réponses/fichiers | Élevé avant toute collecte | Ajouter une persistance et validation serveur versionnées, autorisation par projet, règles de rétention et revue de sécurité avant d’activer un formulaire réel ; tester branches/dépendances et reprise multi-session |

| R25 | Le composant carte est un prototype isolé, non rendu ni testé en navigateur ; sa validation est côté client uniquement et ne contrôle aucun entitlement | Élevé avant intégration | N’intégrer qu’après confirmation serveur de paiement/entitlement ; ajouter validation serveur, persistance/reprise, tests UI clavier/lecteur d’écran/mobile et revue d’accessibilité avant exposition |

| R26 | Le schéma universel déclare 21 types et valide localement la forme des réponses ; devise/arrondi/bornes d’un montant, fichiers, defaults, permissions, validation serveur et tests exécutés restent absents ; le mapping déclaré vers l’aperçu local n’est pas une validation serveur ni une configuration publiable | Élevé avant wizard réel | Définir les règles monétaires côté serveur et valider les données de fichier par signature ; valider migrations/capabilities ; ne jamais exécuter de code fourni par un questionnaire ; tester après disponibilité de Node/npm |

| R27 | L’aperçu et le résolveur de revue valident localement et retournent des décisions explicites, mais restent des fonctions pures sans validation serveur, UI ni persistance transactionnelle | Élevé avant migration de projet | Revalider la cible et les réponses côté serveur, présenter les changements/pertes, stocker une révision immuable et permettre rollback avant migration en masse |
| R28 | Le frontend local déclare des plages de dépendances mais aucun lockfile; les CLI JavaScript sont absentes et aucune suite n'a été exécutée | Élevé avant intégration | Installer Node/npm dans un environnement autorisé, résoudre et figer les versions, exécuter tests/lint/types/build; consigner les résultats exacts |
| R29 | Le dossier local ne contient que `apps/public-web`; admin, runtime multi-tenant et backend Firebase sont absents, tandis que la connexion aux services distants n'est pas vérifiée | Critique avant intégration ou mise en service | Compléter l'audit P0 en lecture seule, valider les environnements et contrats, puis autoriser un lot distinct avant de créer ces applications |

## Mise a jour du 2026-10-12 - apercus sectoriels

La route `/templates` et les fiches `/templates/{templateId}` affichent les 50 apercus locaux et ouvrent des questionnaires conditionnels non persistants. Cela corrige le statut de prototype isole du risque R25, mais ne reduit pas le risque avant mise en service : aucun entitlement serveur, garde apres paiement, sauvegarde, validation serveur ni test navigateur n est present. Le risque reste eleve jusqu a l integration conforme aux phases 5-7 et a leur validation.

## Mise à jour 2026-10-12 — sélection de sections locale

Le schéma 1.3.0 permet de choisir les sections de l’aperçu et migre les versions antérieures connues. Risque restant : cette valeur n’est pas appliquée à un site publié et les migrations/UI ne sont pas exécutées en runtime dans cette session. Garder les 56 modèles en brouillon jusqu’aux tests automatisés, à la revue navigateur et aux moteurs métier requis par P11.
## Mise à jour 2026-10-12 — préférence de paiement dans le wizard local

Le schéma 1.4.0 masque bien les détails de paiements clients lorsque ce choix est désactivé et retire les réponses devenues inapplicables. Ce contrôle est local et ne constitue pas une activation ou une autorisation serveur. Ne pas afficher de paiement réel ni ouvrir le wizard de production avant contrat SmartCut, entitlement, validation serveur et preuves P6/P7.
## Stub SmartCut local

Le port inerte echoue ferme et evite de simuler un paiement, mais n'offre ni authentification, ni idempotence, ni validation de montant, ni signature/webhook, ni ledger. Ne pas l'utiliser comme adaptateur de production. Remplacer son comportement seulement apres reception/revue du contrat officiel et sandbox; conserver un mode d'erreur explicite tant que la configuration n'est pas validee.
### Risque wizard/preview mis a jour
Avant cet increment, certains champs sauvegardes (contexte de campagne, priorites de refonte, details de l'action) n'etaient pas rendus dans l'apercu, ce qui pouvait faire croire qu'une reponse etait perdue. Le mapping a ete complete cote apercu local. Restent a verifier au navigateur: branches, contenu FR, lecteurs d'ecran, mobile/desktop, reprise/conflits multi-onglets et schema de chaque secteur. Aucun test n'a ete execute dans cette session.
| R30 | Les compositions d’aperçu différenciées par flow peuvent être prises pour des fonctionnalités métier actives | Élevé avant publication | Conserver l’étiquette « aperçu local »; aucune action CTA n’écrit ou ne réserve de données; tester chaque flow en navigateur et brancher uniquement après contrats/gates P10/P11 |

| R31 | La restauration après changement de branche est une annulation locale immédiate; elle ne constitue pas un historique serveur durable | Moyen | Vérifier le parcours clavier/navigateur; avant synchronisation multi-appareils, persister un historique/version de brouillon avec contrôles d’accès et rétention validés |

| R32 | Les commandes de navigation du feed sont ajoutées au code mais non vérifiées dans un navigateur avec vidéos réelles | Moyen | Tester focus, défilement, scroll snap, limites des filtres, autoplay muet et reduced-motion sur mobile et desktop avant gate P3 |

| R33 | Le contrôle de contraste ne mesure que 21 couples opaques et ne couvre pas les couches alpha, médias, focus ou non-texte | Moyen | Utiliser `tools/verify-contrast.ps1` comme garde partiel; compléter par revue réelle navigateur, médias, focus, zoom et lecteurs d’écran avant toute déclaration WCAG |

| R34 | La composition immobilière reste plus haute que sa référence et ses données d’annonces sont illustratives | Moyen avant publication | Réduire l’écart desktop (+4,4 % à 742 px), faire une revue d’image détaillée; remplacer les contenus indicatifs par des données autorisées et vérifiées avant toute publication ou transaction |

| R35 | La référence MAISON CORAIL et ses contenus sont illustratifs; le rendu reste 2,1 % plus haut que sa référence à largeur desktop normalisée | Moyen avant publication | Confirmer les photos, tarifs, adresse, services et disponibilité auprès de l’établissement; finir la comparaison détaillée avant toute publication ou réservation |

| R36 | Le rendu tourisme est validé en QA responsive, mais le build de production isolé échoue sous pression mémoire; parcours et offres restent illustratifs | Moyen | Refaire le build quand la mémoire système est disponible; confirmer itinéraires, horaires, guides et prix avant toute réservation |

| R37 | Le template véhicules a passé la QA responsive jusqu’à 1440 px, mais le pixel-match reste inachevé; les informations véhicule sont illustratives | Moyen | Rapprocher la capture desktop de la référence; confirmer modèles, état, prix et disponibilité avant toute demande d’achat, de location ou d’essai |

| R38 | Le prototype repère automatiquement les propriétés éditables dans le DOM; cette heuristique ne définit pas un contrat typé de personnalisation pour chaque template | Moyen avant sauvegarde serveur ou publication | Définir et valider un manifeste de propriétés éditables par template; vérifier validation, permissions, assainissement et migrations avant synchronisation ou publication |
