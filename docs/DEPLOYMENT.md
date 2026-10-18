# Déploiement et exploitation
Aucun projet distant ou déploiement effectif n’a été vérifié ou modifié.

## Dépôt inspecté
Dans smartcutservices/smartcutservices, firebase.json configure Hosting à la racine et Functions sous functions ; Firestore/Storage rules et indexes sont référencés ; Emulator Suite configurée. vercel.json inspecté contient des headers, sans preuve de projet/domaine Vercel. Aucun .firebaserc ni workflow GitHub Actions n’a été observé dans l’arbre. GitHub rapporte main non protégée et quatre branches. Ce sont des éléments versionnés, pas une preuve de production.

## Cible
Public et super-admin : projets/builds Vercel distincts et hôtes distincts. Runtime clients : à décider après PoC. Firebase Auth/Firestore/Functions/Storage ; dev/staging/prod séparés, émulateur local.

## Avant déploiement
Identifier projet/environnement/branche/domaines ; examiner diff rules/indexes/functions ; vérifier secrets, permissions, sauvegarde/rollback ; preview/staging/tests ; production seulement après validation explicite.

## Secrets
Variables publiques uniquement pour config Web Firebase autorisée. Secrets serveur dans Vercel/Firebase Secret Manager, séparés par environnement. Aucun token, clé privée, service account ou secret webhook dans Git.

## À confirmer
Plan/limites Vercel, domaines/SSL/wildcard, projets Firebase, régions/coûts, sauvegarde/restauration, association GitHub, previews, responsables incident. Ne pas inventer le mapping ni les coûts.

## URL de canonical et partage
`PUBLIC_SITE_ORIGIN` is optional locally and remains empty in `.env.example`. Canonical/Open Graph origin and indexable metadata are emitted only when this explicit HTTPS origin is valid and `VERCEL_ENV=production`; verify that Vercel system environment variables are exposed for the production build. Preview/local pages are `noindex,nofollow`; `robots.txt` allows crawling so crawlers can read those directives, and advertises a sitemap only in production. Robots is not preview access control: configure Vercel Deployment Protection separately.

## Public response-header verification
Before a preview is approved, inspect actual responses for the security headers in `apps/public-web/next.config.ts`. CSP is not yet configured; tune it against the built Next.js runtime and media before enabling it. Do not add HSTS until the production domain/subdomain policy is approved. No response-header result exists yet.
