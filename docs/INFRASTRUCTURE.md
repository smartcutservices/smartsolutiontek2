# Inventaire d’infrastructure
Date : 2026-10-11. Sources : document maître et métadonnées/fichiers GitHub lus. Déploiement effectif non vérifié.

## Valeurs déclarées dans le maître
Firebase project ID smartcutservices-9ce54 ; authDomain smartcutservices-9ce54.firebaseapp.com ; storageBucket smartcutservices-9ce54.firebasestorage.app ; messagingSenderId 12148835666 ; appId 1:12148835666:web:d18d80cedd5a36ec81e68b ; measurementId G-TXG8KQDBBG.
Espace Vercel communiqué : smartcutconnect509-7528 (équipe/compte à confirmer). La Web API key est omise ici ; le maître la qualifie de configuration client, non de clé privée.

## GitHub vérifié en lecture
- Dépôt privé smartcutservices/smartcutservices ; ID 1138532933 ; branche par défaut main ; non archivé ; taille GitHub 285220 KB environ.
- Dernier commit consulté : 130e9d04a8 (2026-10-08). Quatre branches visibles ; aucune protégée selon l’API.
- smartsolutiontek/ contient interfaces HTML/CSS/JS, dashboards et rendus métier ; functions/smartsolutiontek/ contient modules Firebase Functions, bibliothèques de domaine et tests.
- Présents : firebase.json, firestore.rules, firestore.indexes.json, storage.rules, vercel.json, functions/package.json.
- Absents de l’arbre consulté : package.json racine, .firebaserc et fichiers sous .github/workflows.
- functions/package.json : Node 22 ; firebase-admin ^12.7.0 ; firebase-functions ^5.1.1 ; sharp ^0.35.4 ; @firebase/rules-unit-testing ^5.0.2. Scripts test:sst, test:rules et test:storage-rules déclarés, non exécutés.
- firebase.json : Hosting public = racine ; Functions source functions ; rules/indexes référencés ; rewrites /p et /pay ; ports Emulator Auth 9099, Functions 5001, Firestore 8080, Storage 9199, UI 4000.
- vercel.json inspecté contient des règles headers/cache ; il ne prouve ni projet Vercel ni domaine associé.
- La connexion GitHub autorise pull/push ; aucune mutation n’a été faite.

## Non vérifié
Aucun accès console Firebase/Vercel, mapping au projet déclaré, état de déploiement, domaine, plan, région, secret, donnée, sauvegarde ou coût. La config versionnée ne prouve pas la production.

Ne jamais inscrire ici une clé privée, token, service account, secret webhook ou clé de paiement.

## Entrées nécessaires au budget P0.7
Aucun coût n’est chiffré sans vérification du plan et sans hypothèses d’usage. Relever, par environnement (dev/staging/prod) :
- Vercel : nombre de projets/builds, heures de build, bande passante, fonctions, domaines, previews, membres et plan réellement souscrit.
- Firebase : régions, lectures/écritures Firestore, stockage et egress média, invocations/durée Functions, Auth, sauvegardes, logs/monitoring et plan.
- Média : nombre et durée des vidéos, taille source/encodée, formats/variantes, préchargement, vues et bande passante mensuelle.
- Produit : sites/tenants actifs, visites, commandes/inscriptions/réservations, rétention des données et croissance.
- Transition : coût humain de réécriture ou portage, double-run, assurance/restauration, domaines et support.

L’état actuel des plans et des consommations n’est pas accessible depuis cette session. Les prix doivent être calculés à partir des grilles officielles en vigueur une fois les quantités et plans confirmés ; les chiffres du maître ne suffisent pas à estimer la facture réelle.

## Repères tarifaires publics vérifiés — 2026-10-12
Ces chiffres sont les tarifs et quotas publiés aujourd’hui; ils ne révèlent pas le plan, les crédits, l’usage, la région ni le coût des comptes SST. Prix Vercel en USD avant taxes. Aucun total projet n’est calculé faute de volumes, nombre de projets/sites, sièges et régions confirmés.

- **Vercel Hobby** : 0 USD/mois, réservé aux usages personnels et non commerciaux selon la FAQ officielle. **Pro** : 20 USD/mois, un siège déployeur et un crédit mensuel de 20 USD inclus; le CDN inclut une capacité de 1 million de requêtes et 1 TB de transfert par mois. Un siège déployeur additionnel coûte 20 USD/mois; les dépassements au-delà du crédit sont à l’usage. Le tarif réel de l’espace communiqué reste inconnu. Sources : [tarifs Vercel](https://vercel.com/pricing), [plan Pro et facturation](https://vercel.com/docs/plans/pro-plan).
- **Cloud Storage Firebase** : le projet Firebase doit être sur Blaze pour accéder aux buckets Cloud Storage; les buckets par défaut `*.firebasestorage.app` sont concernés. Spark ne donne plus accès aux buckets. Pour le bucket moderne, la grille affiche jusqu’à 5 GB-mois stockés, 100 GB téléchargés/mois, 5 000 opérations d’upload/mois et 50 000 opérations de téléchargement/mois sans frais; au-delà, facturation Google Cloud selon configuration/région. Les quotas sans frais n’annulent pas l’obligation de lier la facturation. Ne pas changer de plan ici. Sources : [tarifs Firebase](https://firebase.google.com/pricing), [exigences Cloud Storage et Blaze](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).
- **Cloud Functions** : la grille Firebase affiche 2 millions d’invocations/mois sans frais puis 0,40 USD par million; elle indique aussi 400 000 GB-s, 200 000 CPU-s, 5 GB de réseau sortant et 120 minutes de Cloud Build par jour dans ses paliers gratuits. Les autres coûts dépendent des ressources/régions et du compte de facturation.
- **Cloud Firestore Standard** : la grille affiche jusqu’à 1 GiB stocké, 10 GiB/mois d’egress, 20 000 écritures/jour, 50 000 lectures/jour et 20 000 suppressions/jour sans frais; au-delà, tarifs Google Cloud applicables selon région.

**Décision de cadrage :** le bucket déclaré dans le maître utilise le format moderne `*.firebasestorage.app`. Si ce bucket est effectivement celui du service, son usage exige Blaze. Le plan courant et la propriété du projet ne sont pas vérifiés. Toute liaison Billing/évolution de plan peut engager des frais et reste hors de ce travail.
## Clé Firebase Web présente dans le maître
Le document maître inclut deux fois une clé de configuration Firebase Web. Firebase indique que ce type de clé n’autorise pas à lui seul l’accès aux ressources ; les Firebase Security Rules et App Check portent l’autorisation. La restriction des APIs et les quotas de la clé déclarée n’ont pas été vérifiés. Ne pas confondre cette configuration client avec un secret serveur ; ne jamais ajouter de clé Admin/service account ni de token Vercel/SmartCut au dépôt.
Source : [documentation Firebase sur les clés API](https://firebase.google.com/docs/projects/api-keys).
