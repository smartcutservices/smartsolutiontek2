# Architecture cible — proposition à valider
Date : 2026-10-11. Source prioritaire : maître V0.9.

## Contraintes validées
Next.js, React, TypeScript, Vercel, Firestore, Firebase Authentication, Cloud Functions, Firebase Storage, GitHub, GSAP et Three.js/R3F. Public et admin séparés ; dashboard client dans l’application publique ; paiements métiers via SmartCut côté serveur. Aucun secret serveur dans le frontend.

## Découpage logique proposé
- public-web : feed vidéo, catalogue/aperçus, achat, compte, Mes projets, wizard et dashboard client.
- admin-web : super-admin séparé, hôte et déploiement distincts.
- sites-runtime : rendu des sites client, résolution de domaine/tenant, SEO public ; routage à valider par PoC Vercel.
- Firebase : Auth, Firestore, Storage, Cloud Functions, règles strictes.
- Packages communs possibles : UI/tokens, contrats/schémas, wizard, SDK/manifests, logique métier pure.
Le dépôt racine SmartCut est exclu ; le dépôt SST dédié est choisi. La structure interne (monorepo pour public/admin/runtime/packages ou dépôts applicatifs distincts) reste à arbitrer ; le maître recommande un monorepo possible.

## Existant découvert dans GitHub
smartcutservices/smartcutservices contient smartsolutiontek/ (HTML/CSS/JS, dashboards/renders) et functions/smartsolutiontek/ (Firebase Functions et tests). firebase.json configure Hosting à la racine, Functions, Firestore/Storage rules. La cible V0.9 décrit des apps Next.js/Vercel distinctes : c’est un enjeu de transition, pas une raison de supprimer le code existant. Aucun déploiement effectif n’est prouvé.

Le module SST de paiement reçoit actuellement des internes MonCash du backend SmartCut dans le même dépôt ; cela ne documente pas une API externe. Pour isoler SST, il faut spécifier l’intégration serveur-à-serveur et la frontière des secrets. Le minimum de versement existant n’est pas une décision approuvée.

## Frontières de confiance et données
Opérations sensibles côté serveur ; vérifier identité, rôle, tenant et ressource. Ne pas croire les IDs/roles venant du client. Rules Firestore/Storage complètent les contrôles serveur. Collections candidates non déployées : users, templates/versions, offers, videos/assets, projects/configs/revisions, domains, entitlements, questionnaire, orders, payment intents/events, ledger, withdrawals, audit logs, notifications, agrégats. Définir schémas, index, rétention et rules avant code.

## Routage et déploiement
Le projet Firebase déclaré pourrait être partagé, sans mapping vérifié. Vercel public/admin est cible validée mais aucun projet n’a été consulté. Avant toute mutation : confirmer environnement/partage/sauvegarde/rules. PoC hors prod : host→tenant, 2 domaines, 3 tenants fictifs, refresh/SEO/TLS/cache.

## Questions structurantes
Quel code du sous-projet SST existant est actif ou réutilisable ? Faut-il en migrer sélectivement certains modules dans le dépôt dédié ou les réécrire ? Confirmer l'état de production avant toute transition.

## Comparaison des options de transition P0.7

Le dépôt source cible est désormais le dépôt GitHub dédié `smartsolutiontek` (décision utilisateur). Le choix du dépôt ne tranche pas encore le sort du code SST observé dans SmartCut.

| Option | Bénéfices possibles | Risques / coûts à vérifier | Statut |
|---|---|---|---|
| Repartir proprement dans le dépôt dédié | Séparation nette du cycle SmartCut ; cible Next.js/Vercel cohérente ; structure et contrôles SST autonomes | Réécriture des fonctions utiles ; double identité Firebase possible ; coût de migration et de maintien de deux applications | Option viable, non approuvée |
| Migrer sélectivement les modules SST existants dans le dépôt dédié | Réutiliser des domaines métier et interfaces existants ; séparation du cycle de livraison après migration | Couplage à Firebase et au backend SmartCut ; règles de sécurité à revoir ; dépendances, historique, données et contrats de paiement à cartographier | Option viable sous audit, non approuvée |
| Continuer à développer SST dans le dépôt SmartCut | Réutilisation directe du pipeline et du code présents | Contredit le choix utilisateur d’un dépôt dédié et conserve le couplage de cycle de vie | Écartée comme cible de travail |

### Recommandation de cadrage (à approuver)
Créer le dépôt dédié comme racine de vérité et ne transférer aucun module avant inventaire fichier par fichier, validation des règles Firebase et clarification du contrat SmartCut. Ensuite comparer le coût/risque d’une migration sélective avec la réécriture des modules nécessaires. Cette recommandation n’autorise ni copie ni déploiement.

### Coûts et décision encore impossibles
Pas d’estimation chiffrée crédible sans plan Firebase/Vercel, régions, nombre d’applications/sites, trafic vidéo, volume Storage/Firestore/Functions, domaines et prévisions d’usage. Les variables à estimer sont listées dans `INFRASTRUCTURE.md`. Le budget cible et l’option de migration nécessitent validation du propriétaire.



## Premier increment local
Le frontend public local est dans apps/public-web (Next.js App Router, React, TypeScript). La page est un shell video-first avec filtres et un etat vide explicite, car aucun media/template reel approuve nest present. Aucun SDK Firebase, paiement SmartCut, projet Vercel ou routage tenant nest branche.


## Catalogue vidéo et contrôle de publication local
Le frontend charge `content/catalog.json`, qui reste vide tant qu aucun template/video réel approuvé n est livré. Les types séparent les familles de solutions, les secteurs et les moteurs métiers. Le script `scripts/validate-catalog.mjs` vérifie IDs/version, approbation du secteur, statut déployé, assets locaux, poster, sous-titres éventuels et preuve de droits audio. L application n affiche que les entrées publiées et techniquement déployées ; le build refuse les références vidéo distantes ou les assets absents.
