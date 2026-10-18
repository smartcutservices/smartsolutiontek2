# Sécurité et confidentialité
Politique cible. Prototype UI public local, donnees fictives ; aucun backend cible présent localement ; revue statique partielle des règles et du code SST distant documentée dans REPOSITORY_AUDIT.md. Déploiement et exécution restent non vérifiés.

## Actifs/frontières
Comptes/Auth, réponses clients, pièces jointes, config de site, paiements/ledger/retraits, administration, médias et secrets serveur. Séparer public/admin/client, tenant, site, environnement et flux financiers.

## Contrôles requis
- Auth et autorisation serveur, règles Firestore/Storage deny-by-default, droits par tenant/projet ; ne pas croire IDs/roles clients.
- Firebase Emulator contre lecture/écriture croisée, IDOR, privilèges admin et comptes suspendus.
- Fonctions sensibles : validation, auth, quotas, taille/origine, idempotence ; App Check selon menace.
- SmartCut serveur uniquement ; confirmer statut, dédupliquer événements, montants contrôlés serveur ; ledger immuable et rapprochement.
- Secrets dans gestionnaires sécurisés ; jamais NEXT_PUBLIC_*, Git, logs ou docs. Firebase Web config n’est pas une clé Admin.
- Upload : MIME/signature, taille, privé, URLs signées si nécessaire, rétention et nettoyage.
- XSS, CSRF, SSRF, open redirects, cache privé, CSP/en-têtes, dépendances.
- Minimisation, consentement, export/suppression, conservation, audit et procédure incident.

## Risque infra critique
Le project ID évoque SmartCut sans prouver l’usage réel. Confirmer partage/propriétaire, rules, fonctions, Auth, Storage, IAM, sauvegardes et facturation. Pas de mutation/deploy rules/functions sans diff, validation, rollback. Pas de test production.

## Risques ouverts
Fonds tiers/retraits et conformité BRH/KYC/AML ; données éducatives/santé ; modération/droits vidéo ; Firebase partagé ; routage domaine→tenant/cache. Secteurs réglementés : pas de traitement sensible avant revue juridique/technique.

## Résultats de revue statique des règles existantes (main)
Voir `REPOSITORY_AUDIT.md` pour les SHA et lignes. Le Storage rend publiquement lisibles les fichiers sous `sst-form-uploads`, y compris ceux téléversés anonymement pour un formulaire publié. Le fallback récursif est public pour les racines non exclues ; Firebase autorise une requête lorsqu’une des règles correspondantes l’autorise. Les préfixes de branding `sst-forms`, `sst-shops`, `sst-food`, `sst-services` autorisent l’écriture à tout utilisateur connecté avec filtre image/taille, sans contrôle d’appartenance visible. Risques statiques non vérifiés en Emulator et non confirmés comme déployés.

Avant toute réutilisation : déterminer si les uploads contiennent ou pourraient contenir des données personnelles, décider s’ils doivent être privés, ajouter une stratégie de lecture signée/serveur si nécessaire, exclure les racines privées du fallback, et tester toute écriture cross-tenant. Ne pas changer les règles du projet existant dans le cadre de cet audit.

## Contrôle local avant import GitHub
Le 2026-10-11, un scan heuristique non divulguant sur 73 fichiers détecte la configuration Firebase Web dans le document maître uniquement (deux occurrences connues). Aucun motif de clé privée PEM, token GitHub/Vercel, clé privée de service account ou affectation des secrets connus n'a été trouvé. `.env.example` ne contient que des placeholders. Ce scan ciblé reste indicatif et ne remplace pas un outil de secret scanning.

`.gitignore` exclut maintenant aussi les configs Firebase runtime locales, fichiers de secrets Emulator, `.npmrc` (sauf `.npmrc.example`) et formats courants de keystores. Aucun fichier credential correspondant n'est présent dans le dossier local. L'absence de Git empêche de vérifier `git check-ignore`; avant le premier commit, contrôler les règles avec Git et un scanner de secrets. Les restrictions et quotas de la clé Web restent à vérifier avant toute publication du dépôt.

Firebase indique que les clés Web Firebase servent à identifier le projet, pas à autoriser l’accès ; les Security Rules et App Check assurent ces contrôles. Avant de rendre le dépôt public, vérifier dans Google Cloud que la clé est restreinte aux API Firebase nécessaires, que les quotas sont adaptés et qu’elle n’est pas réutilisée pour une API Google Cloud non Firebase. Garder le dépôt privé jusqu’à cette vérification est la recommandation de préparation. Source : https://firebase.google.com/docs/projects/api-keys.


## Local public-web response headers
`apps/public-web/next.config.ts` currently sets `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and disables camera, microphone, and geolocation through `Permissions-Policy`. These are authored locally and have not been observed on an HTTP response. No CSP or HSTS is configured: validate a Next-compatible CSP against framework scripts/styles and real media first; add HSTS only for a controlled HTTPS production domain. Headers do not replace auth, tenant rules, or private preview protection. Next.js guidance notes that per-request nonce CSP requires dynamic rendering; evaluate its effect on static caching/performance before adopting this route ([CSP guide](https://nextjs.org/docs/app/guides/content-security-policy)).

## Résultat actuel — règles Firestore locales
`firestore.rules` conserve un refus par défaut et autorise seulement un flux de création atomique : un utilisateur crée sous son UID un projet `draft` et son propre membership, avec les permissions limitées `project:read` et `project:edit`. Les règles vérifient les deux documents avec `getAfter`; le client ne peut ni ajouter un collaborateur, ni s’accorder des permissions supplémentaires, ni modifier le document projet/membership après création. Les brouillons vérifient le chemin tenant/projet, l’auteur et une révision strictement croissante.

Huit tests ont réussi contre Firebase Emulator local le 2026-10-15, notamment création appariée, création partielle, élévation de permissions, accès inter-tenant, viewer, compte suspendu et refus des chemins inconnus. Ceci ne prouve pas le déploiement, l’isolation d’un projet Firebase réel, les Storage Rules ou l’identité organisationnelle finale. Ne pas déployer ces règles dans `smartcutservices-9ce54` sans inventaire et analyse de diff.

### Storage pour l’éditeur — Emulator local seulement
`storage.rules` n’autorise les objets de brouillon que dans l’espace UID/projet du propriétaire connecté; contrôle de type MIME déclaré, taille maximale de 8 MiB et refus par défaut ailleurs. Le 2026-10-15, les trois tests Storage ont réussi : propriétaire, accès anonyme/cross-owner et type/taille interdits. Les huit tests Firestore et trois Storage (11/11) passent dans les émulateurs locaux. Le contrôle MIME ne valide pas les octets/signatures; aucun antivirus, quota par utilisateur, nettoyage des anciennes images ou règle de rétention n’est implémenté. Rien n’a été déployé.

Le contrôle navigateur `tools/verify-account-draft-browser.mjs` a aussi réussi un flux Auth → upload Storage → écriture Firestore → rechargement → lecture Storage/Firestore pour un seul compte fictif. Les tests navigateur laissent leurs données dans l’émulateur local, qui reste isolé du projet partagé. Cette validation fonctionnelle ne remplace ni le contrôle de signature, ni le test de sécurité de production, ni un audit App Check/rate limiting.

Le flux E2E supprime aussi, avec confirmation utilisateur, les images figurant dans la configuration du brouillon puis le document brouillon. Il n’efface ni le projet ni le membership et n’est pas une suppression de compte. Les échecs partiels de Storage peuvent laisser le brouillon visible avec certaines images déjà supprimées; ajouter une suppression serveur idempotente avec état de reprise avant de proposer une suppression complète.

## Revue locale P2 - brouillon canonique par projet - 2026-10-16
Les regles Firestore limitent maintenant chaque projet a un seul document brouillon, dont l'ID doit correspondre a `projectId`. La lecture est par document (`get`) seulement; `list` est refuse pour `drafts` comme pour `memberships`. Creation, mise a jour et suppression verifient toutes l'ID canonique, les permissions de membership et le chemin tenant/projet.

Preuves Emulator : 8/8 tests Firestore incluent maintenant refus de listing, refus d'ID de brouillon alternatif, creation/update du draft canonique, revision strictement croissante, separation tenant, viewer et suspension. 4/4 tests Storage passent egalement (12/12 combine). E2E navigateur reussi avec creation et mise a jour successives, restauration et nettoyage complet.

Cette mesure limite l'enumeration et la multiplication de documents par projet dans le prototype. Elle ne remplace ni quota par utilisateur, App Check, anti-abus, controle des valeurs de contenu ou inventaire du Firebase distant; ne pas deployer sans gate P0.
### Bornes de configuration Firestore - 2026-10-16
`validEditorConfiguration` borne maintenant les maps `text` et `links` a 180 cles, `altTexts` a 40, `fields` a 200, `images` a 40; l'accent est vide ou hex `#RRGGBB`. Les listes de sections etaient deja limitees. Tests Emulator rejettent les bornes depassees et une valeur CSS invalide.

Verification actuelle : 9 tests Firestore, 4 Storage (13/13 combine), E2E du compte incluant un upload image traite/restaure et le cleanup, suite Node 152/152, types des trois workspaces et lint cible. Le trigger peut necessiter un temps de chauffe apres des suites qui desactivent/reactivent les evenements; le compte utilisateur de test n'est declare sauvegarde que lorsque le traitement WebP est termine.

Ces bornes limitent la taille logique, pas le type de chaque valeur de map, le debit, le nombre de requetes ni les couts d'un utilisateur. App Check/quotas restent un prerequis avant exposition hebergee.