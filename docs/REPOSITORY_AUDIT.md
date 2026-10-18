# Audit de dépôt — complément Phase 0
Date : 2026-10-11. Source : GitHub connector, lecture seule, dépôt privé smartcutservices/smartcutservices, branche main.

## Métadonnées Git
Dépôt ID 1138532933, privé, non archivé ; branche par défaut main ; poussée la plus récente rapportée le 2026-10-08. Quatre branches listées ; aucune protégée selon l’API. Taille GitHub déclarée : 285220 KB. Aucun checkout local ni écriture distante.

## Structure SmartSolutionTek
- smartsolutiontek/ : admin.html, dashboard.html, page.html, styles.css et rendus cours/champs/restauration/services/boutique ; modules dashboard/courses et learner.
- functions/smartsolutiontek/ : auth, organizations, commissions, pages, payments, payouts, forms, shops, courses, services, food, publication-plans ; bibliothèques domaine/ledger et tests.
- Le point d’entrée SST construit des Cloud Functions préfixées sst et reçoit les internes du fichier Functions racine.
- L’arbre montre donc un sous-système SST dans le dépôt SmartCut ; son état de production et son lien au dossier local/Firebase déclaré ne sont pas vérifiés.

## Configurations et dépendances
- firebase.json : Hosting public = racine ; Functions source functions ; Firestore rules/indexes et Storage rules référencés ; rewrites /p et /pay ; Emulator Auth 9099, Functions 5001, Firestore 8080, Storage 9199, UI 4000.
- vercel.json : headers/cache seulement dans le fichier consulté ; ne confirme pas de projet Vercel.
- functions/package.json : Node 22 ; firebase-admin ^12.7.0 ; firebase-functions ^5.1.1 ; sharp ^0.35.4 ; @firebase/rules-unit-testing ^5.0.2.
- Scripts test:sst, test:rules et test:storage-rules présents ; aucun lancé.
- Pas de package.json racine, .firebaserc ni .github/workflows dans l’arbre récursif consulté.

## Écart et risques
La cible maître est Next.js + Vercel avec apps public/admin distinctes et runtime à cadrer ; le code GitHub découvert est statique sur Firebase Hosting et un backend partagé SmartCut. Le module SST de paiement utilise les internes MonCash du backend commun, pas une API externe observée. Le minimum de payout de 500 HTG et le versement manuel du code ne sont pas des décisions approuvées.

## Limites
Pas d’accès aux données clients, secrets, variables d’environnement, consoles Firebase/Vercel ou statut de déploiement. Revue ciblée des règles Storage/Firestore ajoutée ci-dessous ; audit exhaustif et vérification du déploiement non réalisés. La présence de tests ne prouve pas leur réussite ; aucune commande de test exécutée.

## Revue ciblée des règles Storage (main, 2026-10-11)
Lecture statique via GitHub, sans accès au projet déployé ni aux fichiers stockés. `storage.rules` SHA `1c7e97dfaac7738ad4373606fbf04f4cb1ce5c0f`.

- Lignes 216–224 : `sst-form-uploads/{formSchemaId}/...` autorise `read: if true`. La création anonyme est limitée à un formulaire Firestore existant et publié, image/PDF, maximum 10 MB ; update/delete sont explicitement refusés. Les fichiers téléversés par les visiteurs sont donc lisibles publiquement selon les règles versionnées. Aucun objet ni document de formulaire n’a été consulté.
- Lignes 474–483 : le fallback récursif accorde aussi la lecture publique à tout premier segment non exclu ; `sst-form-uploads` n’apparaît pas dans la liste d’exclusion. Les règles Storage combinent les autorisations qui se chevauchent par OR : un `allow` large vrai ne peut pas être annulé par une règle plus précise. La documentation Firebase le confirme : https://firebase.google.com/docs/storage/security/core-syntax?hl=en.
- Lignes 144–146, 161–169 et 211–214 : branding des préfixes `sst-forms`, `sst-shops`, `sst-food`, `sst-services` lisible publiquement ; les écritures sont autorisées à tout utilisateur connecté avec contrôle image et taille (8 MB), sans vérification visible d’appartenance au formulaire/catalogue/menu/service dans ces expressions. Risque de création/remplacement d’images sur un ID appartenant à une autre organisation à vérifier par test Emulator.
- Lignes 175 et suivantes : `sst-courses` vérifie l’appartenance à l’organisation pour les écritures de branding, ce qui contraste avec les règles des quatre préfixes ci-dessus.

Ce sont des risques issus du contenu de `main`, pas une preuve que ces règles sont déployées. Aucun test dynamique n’a été exécuté ; confirmer le déploiement et couvrir lecture anonyme, création/update cross-tenant et protection des pièces jointes avant de réutiliser ces règles.

`firestore.rules` SHA `bb537b27b535e0db249da89f731988a1765ff014`. Revue de contexte SST ciblée : organisations, membres, formulaires, catalogues/boutiques, cours, services et commandes utilisent principalement `allow write: if false` côté client et des lectures conditionnées par l’état publié, l’appartenance SST ou un rôle plateforme ; Cloud Functions/Admin SDK assurent les mutations sensibles. Cette observation ciblée ne constitue pas un audit exhaustif de toutes les règles Firestore.

