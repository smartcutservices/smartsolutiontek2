# Revalidation de l’état local — 2026-10-15

Ce relevé complète `PHASE_0_AUDIT.md` et `REPOSITORY_AUDIT.md`, qui conservent leurs constats historiques. Il décrit le worktree présent lors de la reprise du mandat maître V0.9.

## Faits vérifiés

| Élément | Preuve locale | Limite |
|---|---|---|
| Applications | `apps/public-web`, `apps/admin-web`, `apps/sites-runtime`; `functions/` existe | Admin et runtime ne sont pas des produits opérationnels complets |
| Dépendances | `package.json`, `package-lock.json`; workspaces npm | Aucun `.git` à la racine du projet; CI et installation fraîche non vérifiées |
| Pages | Feed, catalogue, modèle, compte local, démo, API de validation, SEO, états loading/error/not-found | Dans cette reprise, HTTP 200 confirmé pour `/` et `/templates/education` uniquement |
| Templates | 69 profils au registre; 17 rendus/références conservés; priorités de première version consignées dans `STATUS.md` | 52 profils sans rendu dédié; rien n’est déclaré publié ou opérationnel métier |
| Éditeur | Texte, image/logo, liens, champs, couleur, ajout/réorganisation/masquage de sections; suppression des sections ajoutées; annuler/rétablir; stockage local | Pas de sauvegarde serveur ou de collaboration; l’interface ne garantit pas l’édition de chaque nœud HTML arbitraire |
| Authentification | Client Auth refuse toute configuration autre que `demo-smartsolutiontek` + émulateur localhost; Auth seulement, pas Firestore; `.env.local` ne contient que ce projet démo et `http://127.0.0.1:9099` | Le compte est local à l’émulateur; aucune identité cloud ni sauvegarde serveur |
| Firebase Emulator Suite | CLI 15.34.0, Auth sur `127.0.0.1:9099`, UI sur `127.0.0.1:4000`; cache, JRE et dossier temporaire confinés sous `.tools/` | L’émulateur doit être relancé par `npm run emulators:auth` après arrêt de session |
| Serveur de développement | Processus Next.js/Turbopack écoute sur port 3010; `/`, `/account` et `/templates/education` répondent HTTP 200 | Pas de preuve d’un build de production |
| Tests, lint et types | `npm test`: 143/143; ESLint public-web réussi; typecheck des trois workspaces réussi; création/suppression d’un compte fictif vérifiée par REST contre `127.0.0.1:9099` | Build de production pas exécuté; smoke test Auth n’est pas un E2E navigateur |
| Outils / suivi | Node 22 portable sous le dossier de travail de l’agent; `.tools/` ignoré | Aucun dépôt Git local; aucune branche/PR n’a été créée |

## Infrastructure externe

- Le propriétaire a indiqué que l’espace Vercel est neuf et a autorisé son utilisation. Aucun compte/projet Vercel n’a été inspecté ni créé dans cette reprise.
- Le propriétaire a autorisé l’ajout de ressources Smart Solutions Tech dans Firebase en préservant SmartCut. Le projet `smartcutservices-9ce54`, ses règles, Auth, Storage, Functions, IAM, régions, quotas et facturation n’ont pas été inventoriés ici.
- La commande Firebase en lecture seule `projects:list --json --non-interactive` a été tentée; la CLI répond `Failed to authenticate, have you run firebase login?`. Aucun inventaire distant n’a donc été obtenu.
- Aucun contrat API SmartCut non secret, sandbox ou preuve de comportement de paiement n’est disponible dans ce relevé. Les capacités financières restent fermées.
- Un émulateur isolé utilise le projet de démonstration `demo-smartsolutiontek`, le JRE et son cache sous `.tools/`, et les ports locaux Auth 9099 / UI 4000. Aucune cible `smartcutservices-9ce54` n’est configurée dans cette commande.

## Statut du mandat maître

Le gate P0 reste ouvert pour les inventaires externes, le contrat SmartCut, le budget, les domaines et les décisions métier encore à arbitrer. Les travaux locaux autorisés se poursuivent dans les limites des décisions du propriétaire : feed d’images, conservation des 17 rendus existants, cinq modèles prioritaires et édition directe comme parcours principal; le questionnaire reste une capacité secondaire. Les paiements, l’achat, la publication, les sites multi-tenant et les fonctions métier ne sont pas déclarés prêts.

Les anciens constats incompatibles de `PHASE_0_AUDIT.md` et `REPOSITORY_AUDIT.md` sont conservés pour l’historique; utiliser ce relevé pour l’état local daté du 15 octobre 2026.

## Complément de reprise — 2026-10-15
Le prototype Firestore décrit dans `firestore.rules` est maintenant vérifié localement : Firebase Emulator Auth 9099 et Firestore 8080 sont lancés pour `demo-smartsolutiontek`; huit tests de règles passent, dont la création atomique projet/appartenance à permissions minimales. Ce complément remplace la mention antérieure indiquant que l’émulateur local ne couvrait que Auth. Le modèle reste une ébauche locale, n’est pas connecté à l’éditeur et n’a pas été déployé sur `smartcutservices-9ce54`.
## Contrôles après ajout de la création atomique — 2026-10-15
`node --test` : 143/143 réussis. Suite de règles Firestore Emulator : 8/8 réussis après inclusion du brouillon dans le même lot atomique. `npm run typecheck` : les trois workspaces réussissent. Validation catalogue : 0 entrée publiée, résultat attendu pour les modèles encore en brouillon. La route `/templates/education` répond HTTP 200. Ces contrôles ne valident ni synchronisation de l’éditeur, ni déploiement Firebase/Vercel, ni rendu de production.

## Mise à jour — persistance de l’éditeur dans les émulateurs — 2026-10-15
Le serveur de développement répond toujours HTTP 200 sur `http://localhost:3010/templates/education`. Le parcours d’édition propose maintenant l’enregistrement et le chargement explicites des brouillons du compte local; les images de remplacement sont envoyées vers Storage Emulator, la configuration vers Firestore Emulator. Les 11 tests des règles Firestore et Storage réussissent (8 + 3) et `node --test` réussit 143/143. Une QA navigateur des cinq profils prioritaires, du feed et des 12 rendus de réserve aux largeurs 320/390/768/1440 px a été exécutée pendant cette reprise.

Les émulateurs locaux ne constituent pas des services hébergés. Aucune opération Firebase/Vercel distante, publication ou activation de paiement n’a été faite. Vérification terminée : `npm run typecheck` réussit sur `public-web`, `admin-web` et `sites-runtime`. Cette vérification de types ne remplace pas un test E2E de sauvegarde d’un compte navigateur.

### Résultat E2E compte — 2026-10-15
Après cette note, `tools/verify-account-draft-browser.mjs` a été ajouté et exécuté avec succès : inscription locale par le formulaire, édition d’un texte et d’une image, écriture Firestore et Storage, actualisation, chargement explicite, vérification du rendu restauré puis suppression confirmée du brouillon et des images référencées. Le projet et le membership restent présents. Le compte fictif et les métadonnées restent dans l’Emulator local. La CLI Firebase a été réessayée avec `projects:list`; résultat : `Failed to authenticate, have you run firebase login?`. Vercel CLI et variable de jeton sont absents, donc les inventaires P0 externes ne sont pas acquis. Le test ne déploie rien.

## Revalidation du 2026-10-15 - reprise actuelle
- Firebase Emulator Suite actif pour le projet `demo-smartsolutiontek`: Auth 9099, Firestore 8080, Storage 9199 et Functions 5001. UI Emulator sur 4000.
- Le client accepte uniquement le projet demo et les endpoints localhost. L'editeur direct peut enregistrer/charger explicitement le brouillon d'un compte fictif dans Firestore Emulator et ses images dans Storage Emulator.
- E2E navigateur passe: inscription, edition texte/image, sauvegarde, actualisation, restauration explicite et suppression du brouillon et medias.
- Regles emulator: 12/12 tests (8 Firestore, 4 Storage); suite Node: 146/146; typecheck public-web, admin-web et sites-runtime: passe.
- Site local: `/templates/education` HTTP 200 sur `localhost:3010`. Aucun deploy, ecriture Firebase distant, operation de facturation ou publication.
- L'E2E ne supprime pas encore le document projet ni le membership proprietaire; le nettoyage complet doit etre traite avec une operation serveur privilegiee idempotente. Le traitement d'image doit encore etre audite pour chaque critere P2.
- P0 reste ouvert: CLI Firebase non authentifiee, projet Vercel non initialise, contrat/sandbox SmartCut, couts et domaines non disponibles dans les sources actuelles.
## Revalidation 2026-10-16 - pipeline image et suppression projet
- Le test E2E a expose que le trigger de traitement image supprimait aussi ses variantes WebP lorsqu'elles declenchaient le meme trigger. Le handler filtre maintenant le dossier quarantine; tests unitaires couvrent explicitement l'ignorance des variantes produites et le nettoyage des seuls uploads quarantine mal formes.
- Une Callable Auth `deleteDraftProject` est ajoutee, restreinte au projet demo local. Elle verifie le proprietaire avant le nettoyage Storage, puis effectue la suppression recursive du projet et de ses sous-collections Firestore.
- E2E navigateur reussi : inscription, edition texte/image, sauvegarde, actualisation, restauration des variantes WebP, confirmation puis nettoyage complet du projet, membership et fichiers.
- Tests courants : 152/152 Node, 12/12 regles Firebase Emulator, typecheck des trois workspaces, lint cible sur DirectTemplateEditor et firebase-client.
- Limites actuelles : aucun test/deploiement distant; aucune App Check/quota; la suppression du compte Auth complet, politiques de retention et export restent a concevoir. P0 distant demeure ouvert.