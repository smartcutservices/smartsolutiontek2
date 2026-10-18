# État du projet — 2026-10-15

## Direction produit — édition visuelle directe
- L’utilisateur choisit un modèle et l’édite depuis son aperçu. Le questionnaire ne lance plus la personnalisation; il peut servir plus tard à renseigner des données métier facultatives.
- Le feed et la galerie guident maintenant vers l’édition. La fiche du modèle annonce l’édition du texte, des images/logo, des liens, des couleurs et de la structure.
- L’éditeur fonctionne sans compte en sauvegardant dans le navigateur. Avec un compte de démonstration connecté à l’émulateur local, il peut enregistrer et charger explicitement un brouillon dans Firestore Emulator et ses images dans Storage Emulator.
- Cette synchronisation est locale et n’est pas un service hébergé. Auth, données, règles et fichiers de production n’ont pas été configurés ni vérifiés.

## Priorité de la première version
Le propriétaire a retenu cinq modèles prioritaires : inscription en ligne (`education`), boutique mono-produit, boutique multi-produits, réservation en ligne (`service-booking`) et restaurant. Cette priorité remplace la création immédiate des 69 rendus; les autres travaux existants restent conservés comme réserve. Aucun aperçu n’est de ce fait opérationnel ou publiable.

## État local vérifié
- Monorepo npm avec `public-web`, `admin-web` et `sites-runtime`; admin et runtime restent des shells sans dashboards ni moteurs métier opérationnels.
- L’accueil est un feed vertical de 17 images de référence, sans ancien header/footer, avec J’aime local, commentaires non publiés, partage et personnalisation. Vérification locale : HTTP 200 avec 17 slides; quatre actions locales sur chaque référence.
- 17 rendus sectoriels brouillons sont conservés. Les cinq profils prioritaires sont inclus; 12 rendus additionnels sont en réserve; 52 profils n’ont pas de rendu dédié. Une référence ONG additionnelle reste hors feed et sans rendu.
- Véhicules : QA navigateur à 320/390/768/1440 px réussie sur `localhost:3010`, sans overflow, édition directe disponible. Capture desktop : 742×1292, référence normalisée à 742 px ≈1319 px, écart -2,0 %; pixel-match détaillé à terminer.
- Routes `/` et `/templates/vehicles` renvoient HTTP 200 sur `localhost:3010`.
- Les manifestes restent `draft` / `unpublished`; le catalogue publiable est vide. Aucun paiement ou moteur de transaction n’est actif.

## Vérifications disponibles
- Tests : 141/141 réussis lors de la dernière exécution de cette session.
- ESLint public-web et typecheck des trois workspaces : réussis lors du dernier lot documenté.
- QA navigateur après bascule vers l’édition directe : feed à 17 références et les cinq profils prioritaires vérifiés le 2026-10-15 à 320/390/768/1440 px, sans overflow; texte et texte alternatif, undo/redo texte/alt sur les cinq et champ/undo/redo champ sur multi-produits, photo/logo, liens, sections et persistance locale après rechargement confirmés. ESLint ciblé sur l’éditeur et typecheck public-web passent pour le lot courant. QA véhicules a également passé ces quatre largeurs. Les contrôles utilisent `localhost` pour les ressources HMR de Next.
- Build public-web récent non vérifié; les exécutions antérieures après ajout de profils ont échoué par épuisement mémoire des workers Next.

### Confirmation complémentaire — édition directe
- QA navigateur renforcée réussie sur les cinq modèles prioritaires et le feed : texte, champs, texte alternatif, liens, images, couleur et structure passent Annuler/Rétablir; le remplacement du logo et la persistance locale sont vérifiés.
- Les cinq modèles et le feed ne présentent pas de débordement aux largeurs 320/390/768/1440 px. Le mode édition fonctionne sur `localhost:3010`; Next.js bloque le HMR si le banc de test utilise `127.0.0.1`.
- La sauvegarde d’historique des sections utilise le brouillon IndexedDB sauvegardé pour éviter une capture vide causée par la réconciliation React.
- Ces vérifications frontend ne couvrent ni l’authentification, la synchronisation serveur, les moteurs métier, ni la publication.

### QA des rendus de réserve — 2026-10-15
- Les 12 aperçus conservés hors priorité (training, beauty, vehicles, tourism, hospitality, real-estate, ticketing, events, craftspeople, agency, portfolio, catering) passent la QA navigateur sur le feed et aux largeurs 320/390/768/1440 px, sans débordement.
- Le parcours direct y vérifie texte, texte alternatif, remplacement de photo/logo, lien, couleur, sections, Annuler/Rétablir et persistance locale.
- Le banc attend la fin des transactions IndexedDB d’image avant d’évaluer l’édition du texte alternatif, afin d’éviter une course de test entre deux sauvegardes indépendantes.

### Direction d’édition — 2026-10-15
- La galerie, le feed et la page de modèle conduisent vers l’édition directe dans l’aperçu; le questionnaire n’est plus mis en avant comme parcours de création.
- Vérifications de cette session : 141/141 tests et typecheck public-web réussis; le serveur local répond HTTP 200 sur `localhost:3010`.
- La passe ESLint complète est restée sans sortie et a été interrompue; la passe ciblée a rencontré le même blocage. Les exécutions antérieures de lint sont documentées plus haut.

## Gates encore ouverts
- P0 : inventaires Firebase/Vercel, contrat SmartCut/sandbox, budgets, domaines et décisions structurantes à confirmer. Aucun service distant n’a été modifié.
- P1–P4 : déploiements séparés, CI, Auth/tenant, sécurité Firebase, catalogue admin, modération et analytics non opérationnels.
- P5–P7 : éditeur direct local en prototype (texte, champs de formulaire présents, textes alternatifs, liens sûrs, couleur principale, images/logo, ajout/réorganisation/masquage de sections, annuler/rétablir); accès par compte, sauvegarde serveur, contrat SmartCut et paiement confirmé avant personnalisation absents.
- P8–P10 : publication, dashboards clients et moteurs métier transactionnels absents.
- P11 : priorité aux cinq profils listés; captures, pixel-match et QA de l’édition directe à clore. Les autres catégories restent au backlog.
- P12 : audits sécurité, charge, sauvegarde/restauration, conformité et décision de lancement ouverts.

### Édition directe — complément du 2026-10-15
- Depuis le feed, « Éditer » ouvre le profil choisi; son aperçu accepte l’édition en place du texte, des images/logo, des liens, des champs et de la couleur, avec sauvegarde locale et Annuler/Rétablir.
- Les sections peuvent être ajoutées, réordonnées et masquées; les sections ajoutées peuvent maintenant être supprimées. Les sections d’origine restent masquables et restaurables.
- Vérification après ce changement : lint public-web, typecheck des trois workspaces et 143/143 tests réussis; `/`, `/account` et `/templates/education` répondent HTTP 200 sur `localhost:3010`; smoke test Auth isolé réussi.

Aucune opération distante, modification de facturation ni publication n’a été effectuée. Le serveur local reste disponible sur `http://localhost:3010`.

Pour l’état vérifié du worktree et la réconciliation des audits historiques, voir [`LOCAL_STATE_REVALIDATION_2026-10-15.md`](LOCAL_STATE_REVALIDATION_2026-10-15.md).

### Reprise locale — éditeur et initialisation Firestore — 2026-10-15
- La page de modèle est recentrée sur l’aperçu : grande zone de travail, commandes d’édition proches du rendu, bascule ordinateur/téléphone; le panneau explicatif latéral a été retiré. `/templates/education` répond HTTP 200 sur `localhost:3010`.
- Les règles locales permettent maintenant à un utilisateur de créer atomiquement son projet brouillon et son appartenance à permissions minimales. Huit tests Firestore Emulator passent.
- Les changements de l’éditeur restent dans le navigateur et ne sont pas encore synchronisés avec un projet Firebase; l’Auth est toujours limitée à l’émulateur local. Aucun service cloud n’a été modifié.

### Synchronisation de brouillon locale — 2026-10-15
- L’éditeur propose maintenant une sauvegarde explicite dans Firestore et Storage quand l’utilisateur a un compte de l’émulateur local; le chargement d’un brouillon est une action séparée. Les utilisateurs sans session peuvent toujours éditer et garder leur travail dans le navigateur.
- Le test Firebase Emulator couvre les permissions projet/brouillon et les images privées : 11/11 tests Firestore/Storage réussis. L’application et les règles restent limitées au projet de démo local; aucun compte, document ou fichier n’a été créé dans Firebase distant.
- Ce prototype n’est pas une sauvegarde production. Le modèle de projet, quotas, validation de signature d’image, suppression de compte/données et politique de rétention restent à concevoir.

### Revalidation des règles Storage — 2026-10-15
- Les quatre tests Storage Emulator passent. Les tests utilisent désormais un nom unique par objet, ce qui évite de confondre un fichier résiduel de l’émulateur avec un premier upload. La règle `resource == null` reste en place pour interdire l’écrasement des images en quarantaine.
- Les triggers Functions ont été réactivés après le test. Les émulateurs Auth, Firestore, Storage et Functions tournent toujours en local.

### E2E compte et brouillon — 2026-10-15
- `tools/verify-account-draft-browser.mjs` réussit dans Chrome headless : inscription locale, modification d’un texte et d’une image, sauvegarde dans Firestore/Storage Emulator, actualisation de la route, restauration explicite, puis suppression confirmée du brouillon et de ses images.
- Le contrôle s’exécute avec `npm run qa:account-draft`. Un compte fictif et ses données restent dans l’émulateur local; aucune donnée distante n’a été écrite.
- La suppression cible les seuls chemins d’image listés dans le brouillon et ce document de brouillon. Les métadonnées du projet et son membership propriétaire restent en place; la suppression complète du compte/tenant et un export complet ne sont pas implémentés.
- P2 n’est pas fermé : le flux reste un prototype de démonstration, sans App Check, anti-abus, validation réelle de signature d’image, Functions de traitement ni audit de production.
- Inventaire Firebase distant retenté en lecture seule : la CLI indique qu’aucune session Firebase authentifiée n’est disponible. Vercel CLI et token local absents. P0 reste ouvert.

### Changement de perspective — édition directe (2026-10-15)
- Le modèle s’ouvre directement dans son aperçu; aucune réponse de questionnaire ne sert à construire son rendu ou ne conditionne son édition.
- L’utilisateur active « Éditer le modèle » et modifie le contenu sur place; les propriétés du modèle déjà prises en charge comprennent le texte, les images/logo, les liens, les champs, la couleur et les sections.
- Les questionnaires restent du code de soutien et ne font plus partie du parcours principal. Une aide facultative à la saisie pourra être ajoutée plus tard.
- Vérification : les imports et appels au moteur de questionnaire ont été retirés du composant d’aperçu et de la route du modèle. Typecheck public-web réussi et `/templates/education` répond HTTP 200 sur `localhost:3010` après ce changement.

### Revalidation locale - 2026-10-15
- L'E2E navigateur `tools/verify-account-draft-browser.mjs` passe : inscription du compte fictif, edition directe du texte et d'une image, sauvegarde Firestore/Storage Emulator, actualisation, restauration explicite, puis suppression du brouillon et des images.
- Les regles Firebase Emulator passent 12/12 (8 Firestore, 4 Storage). Les 146 tests Node et le typecheck des trois workspaces passent egalement lors de cette reprise.
- Le controle Storage conserve `resource == null` et les chemins de test ont un UUID pour isoler chaque execution. Les triggers Functions sont reactives apres les tests.
- `http://localhost:3010/templates/education` repond HTTP 200. Les donnees et comptes de demonstration restent dans les emulators locaux; aucune operation distante ou publication n'a eu lieu.
- Prochaine limite de cycle de vie : la suppression de brouillon ne supprime pas encore le projet et son membership. La suppression complete doit etre executee par une operation serveur privilegiee avec verification d'identite et nettoyage rejouable, puis testee sur l'Emulator.
### Nettoyage complet du projet et correctif du traitement image - 2026-10-16
- Le trigger Storage ignore maintenant les fichiers hors du dossier `drafts/quarantine`; seuls les uploads mal formes dans la quarantaine sont supprimes. Avant correction, les variantes WebP produites declenchaient le trigger et etaient effacees. Tests de regression ajoutes.
- La Callable `deleteDraftProject` est limitee a `demo-smartsolutiontek`, exige une session Auth et valide `tenantId`, `ownerUid` et `projectId` avant tout nettoyage Storage. Elle supprime les fichiers du projet puis le projet et ses sous-collections Firestore. Aucun deploiement distant.
- E2E Chrome Emulator passe de bout en bout : inscription, edition texte/image, traitement et restauration WebP, puis suppression du projet, membership et medias.
- Verifications apres corrections : `node --test` 152/152; Firestore + Storage Emulator 12/12; typecheck des trois workspaces; ESLint cible sur les deux fichiers TypeScript modifies. Le site reste sur `http://localhost:3010`.
- Les controles ne ferment pas les gates P0-P12. La Callable refuse tout projet hors demo; App Check, quotas/anti-abus, suppression du compte complet, production, paiement, publication et inventaires distants restent ouverts.
### Sauvegarde repetee du brouillon - 2026-10-16
- La sauvegarde distingue maintenant le projet nouveau du projet existant : la creation atomique projet/membership/brouillon ne se produit qu'une fois; les enregistrements suivants utilisent une transaction qui incremente la revision. Cela evite les tentatives de mise a jour refusees par les regles create-only.
- L'E2E account-draft enregistre maintenant deux fois avant rechargement/restauration, puis supprime le projet complet. Resultat : passe.
- Apres ce changement : `node --test` 152/152, typecheck public-web passe et ESLint cible passe. Le dernier controle Firestore/Storage Emulator reste 12/12.
### Durcissement Firestore local - 2026-10-16
- Chaque projet n'expose plus qu'un brouillon canonique `drafts/{projectId}`. Firestore Rules refusent le listing de la collection et les IDs alternatifs; le client utilise deja cet ID et les revisions dans le document.
- Firestore Emulator : 8/8 tests; Storage Emulator : 4/4; combine 12/12. E2E passe apres sauvegarde initiale/repetee, restauration et suppression complete.
- Suite Node 152/152, typecheck des trois workspaces et lint cible passent.
- Gates P2 toujours ouverts : quotas, App Check/anti-abus, verification stricte des schemas de contenu, suppression/export Auth et retention; aucun service distant inventorie/deploye.
### Limites de configuration en rules - 2026-10-16
- Firestore refuse les accents autres que `#RRGGBB`/vide et borne les maps texte/liens (180), alt (40), champs (200), images (40); les listes de structure ont leurs plafonds existants.
- Test Emulator : 9 cas Firestore + 4 Storage, soit 13/13. Suite Node 152/152.
- E2E Chrome reussi avec les règles courantes apres que le trigger d'image local ait termine sa file : creation, sauvegarde repetee, WebP, restore, suppression projet.
- Typecheck trois applications et lint cible passes a la derniere passe. App Check, quotas, validation stricte de chaque valeur et services heberges demeurent a faire.
### Builds de production locaux - 2026-10-16
- `npm run build --workspace=@smartsolutiontek/public-web` reussi : catalogue valide (0 templates publies) et 78 routes Next generees, dont 69 routes templates.
- Builds `admin-web` et `sites-runtime` reussis egalement; chaque shell genere ses 2 routes de base. Leur build ne signifie pas que les dashboards/runtime métier sont implementes.
- Apres les trois builds, `/` et `/templates/education` repondent HTTP 200 sur `localhost:3010`; Auth/Firestore/Storage/Functions Emulator restent joignables.
- Suite actuelle : 152 tests Node, 13 tests de rules Emulator, E2E complet precedent, typechecks des trois builds et lint cible passent. Aucune publication/connexion distante.
## Avancee P2 - suppression de compte local - 2026-10-16
- Ajout de `deleteDemoAccount`, strictement bloquee hors `demo-smartsolutiontek`. Le client demande le mot de passe recentement et exige la phrase `SUPPRIMER MON COMPTE`.
- La Function recupere les projets directement sous le tenant UID, valide tous leurs triplets `tenantId/ownerUid/projectId` avant toute suppression, efface le prefix Storage, supprime recursivement le tenant Firestore puis supprime le compte Auth en dernier. Une erreur de validation ne declenche aucune suppression.
- Le panneau Auth expose l'action avec un avertissement definitif. Aucun compte distant, projet Firebase partage, abonnement ou facturation n'est touche.
- Preuves actuelles : 3 tests unitaires account-cleanup; 12 tests Functions; 155 tests Node; typecheck public-web; ESLint cible AccountPanel/AccountDeletionPanel; E2E navigateur Auth/draft avec sauvegardes repetee, restauration, nettoyage projet puis suppression et verification d'absence Auth Emulator.
- Restent ouverts : export/portabilite complete des donnees, retention, politiques legales, tests Emulator de la callable d'effacement avec projets/media presents, quotas/App Check et tout le reste des phases du prompt. Rien n'est deploye.

## E2E account cleanup complet - 2026-10-16
Le banc navigateur cree un brouillon de projet, sauvegarde une image traitee, supprime une fois le projet pour verifier sa callable, puis recree le projet avec ses medias. Il supprime ensuite le compte Auth apres reauthentification et confirmation. Le test confirme que le projet Firestore repond 404, que la liste Storage de cet UID est vide, que le panneau annonce un projet nettoye et que les identifiants supprimes ne rouvrent pas de session. Cette preuve est limitee aux emulators locaux.
