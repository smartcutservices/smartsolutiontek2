# Plan SEO multi-tenant
Séparer le catalogue public Smart Solutions Tech du SEO des sites clients.

Pages publiques : title/description, Open Graph, canonical domaine actif, langue/favicon, URLs stables, sitemap/robots, 404/410, redirections, structured data uniquement sur données réelles. Descriptions/posters accompagnent les vidéos.

Pages privées : comptes, paiement, dashboard, brouillons et previews protégés par serveur et noindex ; robots.txt seul n’est pas contrôle d’accès. Aucune donnée privée en cache public.

Multi-tenant : host→site sûr, canonical unique au changement domaine ; éviter injection croisée de métadonnées, sitemaps et cache. PoC requis avant runtime. Aucun audit externe SEO possible en P0.

## Public app P3 implementation
- The homepage and published demo pages expose canonical/Open Graph URLs only when `VERCEL_ENV=production` and `PUBLIC_SITE_ORIGIN` is a valid approved HTTPS origin (localhost HTTP may be accepted for local parsing but is never indexable; production indexing independently requires HTTPS).
- `app/robots.ts` keeps pages crawlable so crawlers can read preview/local `noindex` metadata; it advertises a sitemap and host only in production. `app/sitemap.ts` is empty unless indexable and then lists the homepage plus published demos only.
- Page metadata sets `noindex,nofollow` outside the configured Vercel production environment. This is an indexing instruction, never an access-control mechanism; private routes/data still require server authorization.
- No production origin is configured, so the current app is intentionally not indexable. Rendered route output and search-engine behavior have not been verified without Node/Vercel.
- `apps/public-web/app/icon.svg` supplies the public app icon through the Next.js metadata file convention. Its geometry follows the local prototype mark and is not an approved brand identity.
- A root `app/not-found.tsx` provides a French not-found view for unpublished demo IDs and unmatched public URLs; it sets noindex/nofollow and returns users to the catalog.

Le catalogue `/templates` et ses fiches sont des apercus generiques de construction; ils portent `noindex,nofollow` et ne sont pas inclus au sitemap. Ne les rendre indexables qu apres validation des offres, des medias et du contenu reel.