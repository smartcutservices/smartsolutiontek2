# Plan de développement exécutable — Smart Solutions Tech
Date : 2026-10-11. Base : document maitre V0.9. Etat : prototype local en cours ; P0 distant ouvert.

État local complémentaire au 2026-10-12 : wizard avec avertissement annulable des réponses retirées, cinq compositions visuelles de preview par flow, et contrôles précédent/suivant du feed. Ces incréments restent non exécutés en build et non vérifiés en navigateur; le catalogue vidéo publié est vide. Le P3.1/P3.2 n'est donc pas considéré terminé.

## COMPLEMENTS DETAILLES P10/P11

### P10 - lots metiers atomiques
Branche feat/P10-business-engines, dépend de P8/P9. Fichiers/modules exacts à confirmer après choix d’architecture.
- P10.1 Inscriptions/formulaires : schéma, pièces, statuts, quotas, export, reçus, anti-spam. Tests validations, doublons, upload privé, accès croisé. Acceptation : parcours candidat/admin E2E et règles tenant vérifiées. Risque : documents sensibles.
- P10.2 Commerce : produits, variantes, panier, stock et commandes. Tests concurrence du dernier article, panier périmé, remboursement. Acceptation : commande/idempotence cohérentes. Risque : finance/taxes.
- P10.3 Réservations : disponibilité, fuseaux, capacité, annulation/report. Tests collision et limites horaires. Acceptation : jamais de double réservation. Risque : zones horaires et pics.
- P10.4 Restauration : menus/options, heures, préparation, retrait/livraison. Tests hors horaires, indisponibilité et zone. Acceptation : commande valide selon configuration réelle.
- P10.5 Contenu/vitrine/portfolio : pages, médias, contact, SEO. Tests accès et sanitization. Acceptation : pages indexables publiques, privées protégées.
- P10.6 Notifications/support : préférences, consentement, retries et journal. Tests désabonnement, échec/répétition. Acceptation : pas de double envoi non idempotent ni message marketing sans consentement.
Chaque moteur est un lot distinct sur feat/P10-[moteur], avec validation métier, UI responsive, contrôles serveur, coût et état d’erreur.

### P11 - couverture des categories candidates
- P11.1 Taxonomie : liste principale/sous-catégories, moteur partagé, ordre MVP. Fichiers docs/TEMPLATE_STANDARDS.md et registre catalogue à créer quand les catégories sont approuvées. Dépend propriétaire. Acceptation : catalogue signé ; secteurs réglementés limités au périmètre validé.
- P11.n Une tâche séparée par catégorie retenue, branche feat/P11-[category-id]. Modules : manifest, assets/vidéo, wizard, moteur, renderer, dashboard. Tests unitaires/intégration/E2E, responsive, SEO, sécurité et performance. Acceptation : un template opérationnel testable par catégorie validée, manifeste compatible, démo conforme et licence média documentée. Risque : volume de scope ; ne pas considérer les 50 candidates comme approuvées.

## Gouvernance du backlog
Chaque tâche porte un ID unique et reste un lot de branche/PR cohérent. Avant exécution, inscrire l’objectif, les modules/fichiers, dépendances, branche, étapes, contraintes UX/responsive/SEO/sécurité/performance, tests, critères d’acceptation et risques/blocages. Les tâches ci-dessous indiquent ces champs de façon compacte ; les critères communs s’appliquent partout. Toute modification de Firebase/Vercel exige état initial, diff, sauvegarde/rollback, validation et revue. Aucun déploiement de production sans validation explicite.

### Définition commune de terminé
- Fonctionnel selon contrat, cas d’erreur/loading/empty/offline applicables.
- Lint/types/build/tests pertinents exécutés et résultat enregistré ; aucun test déclaré sans preuve.
- Responsive, clavier, accessibilité, SEO et performance vérifiés selon périmètre.
- Autorisations et isolation tenant testées lorsque données privées sont touchées.
- Documentation, risques, décisions, changelog, coût et rollback actualisés.
- Revue humaine aux gates sensibles.

## Graphe de dépendances
P0 → P1 → P2 ; P1 → P3 ; P2+P3 → P4 ; P2+P4 → P5 ; P2+contrat de paiement → P6 ; P5+P6 → P7 ; P7 → P8 ; P8+P6 → P9 ; P8+P9 → P10 → P11 → P12. Les contrats partagés doivent être stabilisés avant tout travail parallèle.

## PHASE 0 — Audit, cadrage et preuve de faisabilité
Branche documentaire recommandée : docs/P00-audit-cadrage. Le dépôt local n’est pas Git.

| ID | Objectif / modules | Dépendances et branche | Étapes / contrôles / tests prévus | Acceptation mesurable | Risque / état |
|---|---|---|---|---|---|
| P0.1 | Inventaire local du dossier, docs, manifests, code, config, Git | Aucun ; docs/P00-audit-cadrage | Inventorier fichiers cachés, repérer outils et vérifier versions sans exposer secrets | STATUS consigne exactement présents/absents et commandes disponibles | Inventaire local fait et consigné dans PHASE_0_AUDIT; 73 fichiers examinés pour scan heuristique, JSON parsés; CLI git/node/npm/vercel/firebase absentes; lockfile absent |
| P0.2 | Audit source GitHub et branchements SST | Accès GitHub lecture ; même branche | Relever repo, visibilité, branche/date, tree SST, config, manifests, tests, protections ; sans clone/write ni données client | REPOSITORY_AUDIT cite faits et limites ; lien dossier local/repo demandé | Audit GitHub historique dans REPOSITORY_AUDIT; non rafraîchi depuis que le propriétaire a différé GitHub; correspondance local/repo et production inconnues |
| P0.3 | Audit Firebase existant et partage SmartCut | Accès console lecture ou inventaire autorisé | Confirmer projet, Auth, rules, indexes, Functions, Storage, régions, IAM, quotas/sauvegardes ; ne pas lire données personnelles | Tableau environnement↔ressources et risque de partage prouvés | Bloqué : accès console/mapping absent ; le bucket déclaré dans le document maître est en firebasestorage.app ; la règle Firebase exige Blaze pour utiliser Cloud Storage ; forfait courant inconnu |
| P0.4 | Audit Vercel, GitHub CI et domaines | Accès lecture compte Vercel et DNS | Confirmer équipe, projets, association repo, environnements, domains/TLS/limites/preview | Carte des déploiements et limites avec preuve | Bloqué : console inaccessible ; vercel.json seul ne prouve pas un projet |
| P0.5 | Cadrage produit, rôles, taxonomie et MVP | Maître V0.9, propriétaire | Résoudre 3 rôles visiteur/propriétaire/admin, liste des catégories principales, flux vidéo→achat→wizard, inclusion/exclusion MVP | Décisions approuvées dans DECISIONS ; catégories retenues listées | Profils identifiés (visiteur/propriétaire/admin), collaborateurs plus tard ; module initial inscription en ligne ; 50 catégories extraites comme candidates, sélection MVP non approuvée |
| P0.6 | Contrat SmartCut et modèle financier | Contrat non secret, sandbox, revue juridique | Cartographier achat SaaS vs paiement final, auth/idempotence/statuts/callback/refund/settlement ; aucun secret/transaction réelle | Contrat versionné ; limites et obligations tierces documentées ; tests sandbox définis | Handlers internes `createPaymentIntent`/`paymentWebhook` repérés ; contrat externe SmartCut, sandbox, frais et autorisation fonds tiers restent bloquants |
| P0.7 | Architecture cible et coûts | Résultats P0.2–P0.6 | Comparer réutilisation, migration progressive et séparation ; modéliser frontières tenant, apps, données, runtime, médias et coûts | Architecture et budget cible approuvés ; stack validée respectée | Comparaison repartir proprement vs migration sélective documentée ; budget réel et choix restent ouverts faute de métriques/accès |
| P0.8 | PoC routage multi-tenant | Domaines/test env isolés ; approbation P0 | Prototype 3 tenants fictifs/2 domaines ; URL profonde/refresh, TLS, canonical/SEO, cache privé et isolation | Rapport reproductible sans fuite ; architecture runtime approuvée | Non commencé ; aucun accès Vercel/Firebase de test |
| P0 Gate | Décision de sortie | P0.1–P0.8 | Revue propriétaire de l’audit, risques, budget, contrat, domaines et migration | Tous bloqueurs explicitement clos ou acceptés ; validation écrite avant P1 | Ouvert |

## PHASE 1 — Fondations, CI/CD et design system
Branche feat/P01-foundation ; dépend P0 Gate.
- P1.1 Repo et gouvernance : initialiser le dépôt dédié `smartsolutiontek`, puis définir CODEOWNERS, protections, stratégie branches et PR. Modules GitHub. Test : règles et PR de démonstration. Acceptation : main protégée et reviewers définis. Risque : création distante/import en attente des capacités GitHub.
- P1.2 Applications : créer public-web et admin-web avec projets Vercel distincts ; créer sites-runtime seulement après PoC. Tests : build et preview par app. Acceptation : hôtes/builds séparés. Contraintes : previews privées, aucun domaine prod avant validation.
- P1.3 Socle code : TypeScript strict, Next.js, schémas, lint, format, composants partagés. Tests lint/typecheck/build. Acceptation : CI verte, imports serveur exclus du client.
- P1.4 Environnements : Firebase dev/staging, Emulator Suite, config par env, secrets. Tests de démarrage/emulator. Acceptation : aucun secret Git/bundle ; production isolée.
- P1.5 Design/observabilité : tokens accessibles, états de base, logs sans données sensibles et erreurs corrélées. Tests accessibilité de composants et vérification log. Acceptation : inventaire UI et logs contrôlés.
Gate P1 : build/preview public et admin indépendants, pipeline vert, démarrage reproductible, aucun secret exposé.

## PHASE 2 — Authentification, tenancy et sécurité Firebase
Branche feat/P02-auth-tenancy ; dépend P1.
- P2.1 Identité/session : signup/login, vérification email, récupération, session et déconnexion. Modules Auth/public. Tests unitaires/E2E états de compte. Acceptation : parcours et erreurs documentés.
- P2.2 Modèle propriétaire/site/membership : schémas users/projects/sites/memberships/audit. Tests validation/migration. Acceptation : chaque doc privé a owner/tenant/project.
- P2.3 Autorisation et règles : rôles backend, deny-by-default Firestore/Storage, accès admin. Emulator tests A↔B, IDOR et privilèges. Acceptation : zéro lecture/écriture croisée.
- P2.4 Abus et données : rate limit, App Check si retenu, journal sensible, export/suppression/rétention. Tests limites et audit. Acceptation : abus et rétention définis ; aucun rôle client fiable.
Gate P2 : tests Emulator prouvent isolation de 2 tenants et refus admin.

## PHASE 3 — Découverte vidéo et catalogue
Branche feat/P03-video-feed ; dépend P1.
- P3.1 Feed vidéo : lecture initiale, scroll/snap, une vidéo active, poster, pause hors écran, preload borné. Tests UI/réseau lent/appareil modeste. Acceptation : clip réel immédiatement découvrable, aucun clip sonore auto.
- P3.2 Catégories et fiche : filtre horizontal, preview réelle, lien partageable, CTA et état catalogue réduit. Tests navigation clavier/mobile. Acceptation : chaque CTA ouvre la bonne fiche/offre, aucune fiche fictive.
- P3.3 Médias et interactions : modération/droits, likes/comments/share si périmètre confirmé, événements analytics consentis. Tests permissions/anti-abus et compatibilité. Acceptation : actions accessibles, métriques non fictives.
  Avancement local : P3.1 dispose des contrôles de défilement précédent/suivant, mais aucun parcours P3 n'est accepté tant que démos réelles, interactions autorisées, QA et builds ne sont pas vérifiés.
Qualité : SEO catalogue, reduced motion, data saver, budget vidéo établi après mesure.

## PHASE 4 — Manifests, registre et dashboard admin
Branche feat/P04-template-admin ; dépend P2 et P3.
- P4.1 Contrat template : ID/version/capabilities/schema/preview/compatibilité. Tests de manifeste invalide/valide. Acceptation : build rejette incompatibilité.
- P4.2 Synchronisation registre : lister uniquement templates intégrés et déployés. Tests absence/rollback/version. Acceptation : non déployé non vendable.
- P4.3 Admin séparé : associer vidéos/offres/catégories/prix/visibilité avec RBAC/audit. Tests permission et publication. Acceptation : offre publiée sans push public, admin sur hôte distinct.
- P4.4 Modération/version : retirer/archiver/revenir à version et tracer. Tests de transitions. Acceptation : historique intact et actions autorisées seulement.
Gate P4 : template livré par Git et métadonnées publiées par admin.

## PHASE 5 — Questionnaire conditionnel
Branche feat/P05-wizard ; dépend P2/P4.
- P5.1 Moteur déclaratif : types, conditions, validation, dépendances et versions. Tests unitaires branches/types. Acceptation : aucun code arbitraire client exécuté.
- P5.2 Parcours une carte : retour, progression honnête, auto-save, reprise et conflits. E2E coupure/session/onglets. Acceptation : réponses persistées et erreurs compréhensibles.
- P5.3 Configuration sûre : aperçu desktop/mobile, champs éditables autorisés, branches invalidées avec historique. Tests migration/valeurs obsolètes. Acceptation : seules valeurs valides publiables.
- P5.4 Édition après publication : cibler section, preview, publication/rétablissement. E2E rollback. Acceptation : modifier une section ne rejoue pas tout le questionnaire.
Gate P5 : trois parcours conditionnels reprenables ; aucune question de paiement métier si désactivé.

## PHASE 6 — Paiement SmartCut, ledger et versements
Branche security/P06-payment-contract ; dépend P2 et contrat officiel.
- P6.1 Contrat/adaptateur : auth serveur, API, événements et erreurs. Tests contrat sandbox uniquement. Acceptation : spécification réelle sans endpoint supposé.
- P6.2 Intents/webhooks : montant serveur, références/idempotence, vérification callback/statut. Tests double, retard, fraude et panne. Acceptation : navigateur n’est jamais source de vérité.
- P6.3 Ledger/rapprochement : entries append-only, frais/net/due séparés et retries. Tests invariants/concurrence. Acceptation : opérations idempotentes et conciliables.
- P6.4 Remboursement/retrait : états, approbations séparées, gel atomique, preuves et KYC selon contrat. Tests doubles demandes, insuffisance, rejet/échec. Acceptation : aucun double retrait ; exigences légales validées.
Bloqué jusqu’au contrat, sandbox, conformité et validation du modèle fonds tiers.

## PHASE 7 — Achat avant personnalisation
Branche feat/P07-purchase-gate ; dépend P5/P6.
- P7.1 Offre/checkout : prix, type, renouvellement, conditions/frais affichés. Tests affichage et historiques. Acceptation : aucune ambiguïté entre achat template et paiement métier.
- P7.2 Entitlement : création après confirmation serveur, reprise/expiration/remboursement. E2E bypass/double clic. Acceptation : wizard impossible sans droit valide.
Gate P7 : paiement en attente/échec ne débloque pas la personnalisation.

## PHASE 8 — Runtime tenant, domaines et publication
Branche feat/P08-tenant-runtime ; dépend P7 et PoC.
- P8.1 Résolution domaine : host→site vérifié, cache partitionné, collision. Tests host inconnu/cross-tenant. Acceptation : aucune fuite.
- P8.2 Publication : draft/preview privée/publish/unpublish/rollback. Tests atomiques et restauration. Acceptation : ancienne version restaurable.
- P8.3 SEO et domaines : canonical, robots/sitemap, TLS/DNS, redirects, expiration. Tests pages privées/non indexées et domaine invalide.
Gate P8 : 3 sites fictifs, 2 domaines, refresh et rollback vérifiés.

## PHASE 9 — Profil, Mes projets et dashboard client
Branche feat/P09-client-dashboard ; dépend P8/P6.
- P9.1 Liste/projet : accès aux projets propres, statut, raccourcis. E2E 2 projets/2 comptes. Acceptation : aucun accès étranger.
- P9.2 Dashboard métier : statistiques réelles, filtres, pagination, états vides. Tests agrégats et permissions. Acceptation : aucun chiffre décoratif/fictif.
- P9.3 Personnalisation/paramètres : champs autorisés, domaine/plan/facturation, export autorisé. Tests publication/rollback/permissions.
Gate P9 : édition isolée par projet.

## COMPLEMENTS DETAILLES P10/P11

### P10 - lots metiers atomiques
Branche feat/P10-business-engines ; dépend P8/P9.
Lots séparés : formulaires/inscriptions ; catalogue/commerce/commandes/stock ; réservations/calendrier ; restauration/menu ; contenu/vitrine/portfolio ; notifications/support. Chaque lot a schéma, états et règles serveur, écran responsive, exports/notifications nécessaires, tests unitaires/intégration/E2E métier et cas limites. Acceptation : aucun paramètre hors-capacité template, transactions concurrentes sûres. Bloquer finance et données réglementées sans revue.

### P11 - couverture des categories candidates
Branche feat/P11-sector-templates ou une branche par catégorie.
- P11.1 Approuver taxonomie, sous-catégories et moteur partagé.
- P11.n Construire chaque template avec manifest, vraie démo/vidéo/licence, questionnaire, rendu, dashboard, SEO, responsive et tests.
Tests visuels/appareil et E2E spécifiques. Acceptation : 100 % des catégories principales validées disposent d’un template opérationnel testé. Les candidates du maître ne sont pas automatiquement sélectionnées.

## PHASE 12 — Audit opérationnel et lancement
Branche audit/P12-launch ; dépend P11.
- P12.1 E2E/load : parcours visiteur→achat→wizard→publication→transaction, feed, Firestore, Functions et domaines. Acceptation : budgets approuvés tenus.
- P12.2 Sécurité/conformité : rules, secrets, paiement, privacy, secteurs, dépendances et contrôle admin. Acceptation : aucun finding critique ouvert.
- P12.3 Reprise/exploitation : sauvegardes et restauration testées, alertes coût/erreur, runbooks/incident/rollback. Acceptation : exercice documenté.
- P12.4 Bêta/go-no-go : support, modération, corrections, lancement progressif. Acceptation : approbation owner et responsables identifiés.

## État d’exécution actuel
P0.1 inventorié localement avec limites ; P0.2 historique/non rafraîchi ; P0.3/P0.4/P0.6 et PoC P0.8 sans preuve de service ; P0.5/P0.7 documentés, validations ouvertes. Voir `docs/PHASE_0_AUDIT.md`. Aucun test exécuté. Gate P0 ouvert. Les travaux d'implémentation P1 attendent le gate et la validation humaine requise.




## Mise a jour du 2026-10-12 - tranche locale templates

A la demande explicite du proprietaire, les 50 candidates V0.5 et six familles V0.9 absentes sont couvertes dans le registre et les routes locales `/templates` et `/templates/{templateId}`. Chaque fiche a un contenu d’aperçu propre au secteur (titre, CTA, sections), un questionnaire conditionnel avec profil métier distinct, et une prévisualisation qui se met à jour avec les réponses (nom, offre, action, détail et palette). La generation statique valide le compte, les IDs uniques et les schemas des 56 questionnaires avec le validateur universel. Ce travail reste un apercu local : il ne satisfait pas P11.n, qui exige pour chaque categorie retenue un site operationnel, manifeste, video/licence verifiee, dashboard, tests et validation complete. L approbation du catalogue de lancement et les gates P0/P1/P2/P4/P6/P7 demeurent distincts.
### Mise à jour locale 2026-10-12 — contribution P5.3
Le wizard des 50 fiches alimente maintenant l’aperçu visuel en direct à partir des réponses locales. Les branches restent conditionnelles et les réponses masquées sont invalidées par le moteur existant. Ce raccord satisfait uniquement le prototype d’aperçu local; il ne fournit pas l’autosave/reprise, les tests, la persistance serveur, l’édition d’un site publié ni le gate P5.
### Mise à jour locale 2026-10-12 — contrat manifestes P4.1
Les 50 manifests locaux exposent désormais ID/version, secteur candidat, capacités de parcours, référence versionnée au questionnaire, propriétés éditables, compatibilité moteur, assets, aperçu et statuts. Le garde de génération vérifie leur couverture. Aucun dashboard admin, média licencié ou publication n’est livré; le gate P4 et P11 reste ouvert.
### Mise à jour locale 2026-10-12 — contribution P5.1
Les schémas des 50 secteurs déclarent maintenant visibilité, dépendances, version et bornes textuelles. Le moteur générique existant valide les réponses locales; l’auto-save, la reprise, la persistance et la validation serveur demeurent hors de ce prototype.
### Mise à jour locale 2026-10-12 — aperçu P5.3 bureau/téléphone
Le prototype de chaque fiche offre maintenant deux cadrages d’aperçu accessibles, et un changement de secteur réinitialise le brouillon local. Les preuves responsive réelles, l’édition de site publié, l’historique des changements et la persistance restent nécessaires pour le gate P5/P11.

### Mise à jour de couverture sectorielle candidate — 2026-10-12
La comparaison avec les 56 lignes du tableau de taxonomie P0.7 a identifié 11 familles non représentées par un ID dédié. Le registre local compte maintenant 67 profils candidats (56 initiaux + 11), chacun avec un profil de questions et un aperçu; les gardes du build attendent 67. Ce rapprochement ne vaut pas approbation de la taxonomie et ne satisfait pas P11: moteurs opérationnels, dashboards, publication, médias/licences et QA restent manquants.
### Mise à jour taxonomie — total courant 69
Deux catégories supplémentaires de la taxonomie P0.7, épiceries/marchés et petites entreprises locales, ont reçu un profil dédié après le premier ajout de 11 catégories. Total de travail : 69 profils candidats. Les anciens comptes de 56 et 67 dans les notes précédentes sont historiques.
