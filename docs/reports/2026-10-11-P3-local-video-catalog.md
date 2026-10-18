# Rapport d’exécution — P3, contrat du feed vidéo local

## Objectif et périmètre
Structurer le catalogue vidéo local et empêcher l’affichage/la publication d’entrées fictives, de templates non déployés ou de médias sans droits documentés. Aucun service externe ni donnée commerciale n’est connecté.

## État initial observé (preuves)
- `apps/public-web/content/catalog.json` contient zéro entrée ; aucun asset vidéo/template local n’est présent.
- Le shell public avait un état vide honnête et des filtres de familles.
- Node.js/npm ne sont pas disponibles dans cette session.

## Fichiers créés/modifiés
- `apps/public-web/app/catalog-types.ts`, `app/catalog.ts`, `content/catalog.json`.
- `apps/public-web/scripts/validate-catalog.mjs`, `tests/catalog-validator.test.mjs`, `package.json`.
- `apps/public-web/app/page.tsx`, `app/globals.css`.
- `docs/NEXT_TASK.md`, `docs/TEMPLATE_STANDARDS.md`, `docs/ARCHITECTURE.md`, `docs/STATUS.md`, `docs/CHANGELOG.md`, `README.md`.

## Contrats et décisions respectés
- Famille de solution, secteur et moteur métier sont trois champs distincts.
- Les catégories candidates ne sont pas considérées comme approuvées.
- Une entrée publiée exige un secteur approuvé, un template déployé, un ID/version valides, une vidéo MP4 et un poster locaux, un alt text et une preuve de droits dans `docs/licenses/`.
- Le feed n’affiche que des entrées marquées publiées et déployées dont le secteur est approuvé.
- Le lecteur utilise les contrôles natifs, démarre muet, pause les vidéos hors écran/onglet, ne précharge que la vidéo active/la suivante et respecte `prefers-reduced-motion`.
- Aucune offre/prix, achat, like, commentaire ou lien de partage inventé n’est exposé.

## Tests réellement exécutés et résultats
- Contrôle statique PowerShell : `package.json`, `tsconfig.json` et `content/catalog.json` se décodent comme JSON ; Node exigé >=20.9.0, TypeScript strict activé, catalogue vide, script `node --test` présent.
- Dix tests Node ont été écrits : entrée publiée valide, ID dupliqué, secteur non approuvé, asset hors répertoire template, preuve de droits manquante, date invalide, tentative de traversal inter-template et famille recommandée non approuvée.
- Les tests, validateurs, typecheck, lint et build n’ont pas été exécutés : `node`/`npm` absents.

## Problèmes, dettes techniques, risques
- Aucun template, vidéo, poster, route de prévisualisation ou pricing n’est encore disponible.
- L’association entre `previewRoute` et un renderer réel reste à implémenter avant toute entrée publiable.
- Pas de like/commentaires/modération/partage, auth, API ou admin ; ces actions nécessitent les contrats et contrôles d’accès.
- L’accessibilité, le responsive réel, les performances et l’autoplay sur navigateurs doivent être validés visuellement et sur appareils.

## Ce qui n’a PAS été fait
Pas de Firebase, Cloud Functions, paiement SmartCut, Vercel, GitHub, domaine, template réel, média distant ou publication. Pas de build ni test déclaré réussi.

## Instructions pour reprendre dans une autre session
Lire le maître et les registres projet. Installer Node.js >=20.9 dans un environnement local, puis `npm install`, `npm run test`, `npm run catalog:validate`, `npm run typecheck`, `npm run lint`, `npm run build`. Corriger avant d’intégrer un média/template réel. Garder les opérations financières, auth et infrastructure dans leurs gates respectifs.

## Prochain lot proposé (sans l’exécuter automatiquement)
Rendre le validator réellement exécutable et corriger toute erreur statique dans un environnement Node ; ensuite décider et créer la première route preview seulement pour un template réel validé.

## Contrôle qualité par rôle
| Rôle | État / preuve |
|---|---|
| Produit / UX | Partiel : aucune fausse entrée commerciale ; parcours d’achat absent. |
| UI | Partiel : layout feed et contrôles écrits ; revue visuelle non exécutée. |
| Frontend | Partiel : types/lecteur écrits ; compilation non vérifiée. |
| Firebase / backend | N/A : aucune intégration. |
| Cybersécurité | Partiel : chemins médias locaux et preuve de droits exigés ; audit runtime non exécuté. |
| Performance | Partiel : pause et preload borné codés ; aucune mesure. |
| SEO | N/A : pas de template ou route publiable. |
| Marketing / conversion | N/A : pas d’offre approuvée. |
| QA / SRE | Partiel : tests écrits ; non exécutés ; aucune CI. |
| Finance / conformité | N/A : aucun flux financier. |

## Revue statique complémentaire
Le validateur résout maintenant les chemins réels des assets et des preuves de droits et refuse une cible qui sort du dossier public ou du projet, y compris via un lien symbolique. Cette modification a été inspectée dans le fichier ; elle n’a pas été exécutée ni testée faute de Node.js.
## Recherche du catalogue
Le feed propose maintenant une recherche côté client sur le titre, la description, la famille, le secteur et l’identifiant, avec effacement et état distinct « aucun résultat ». Les tris populaires/récents/adaptés ne sont pas inventés : le catalogue ne contient aucun modèle réel, les métriques d’usage ne sont pas branchées et la taxonomie d’activité reste à approuver. Revue statique seulement ; aucun build ou contrôle navigateur disponible.
## Tri chronologique
Le manifeste exige désormais `publishedAt` au format ISO canonique pour toute entrée publiée. Le feed peut trier par date réelle ; les options popularité et activité restent désactivées faute de métriques/choix d’activité. Un sixième test de validateur couvre la date invalide. Tests non exécutés (Node absent).
## Validation runtime avant affichage
`app/catalog.ts` ne fait plus de cast de confiance depuis le JSON. Un garde-fou de type vérifie la structure publiée, le secteur approuvé, la date ISO, les moteurs connus, les routes attendues, les chemins médias locaux/extensions et les mentions de droits avant de fournir une entrée au feed. Le validateur prebuild reste responsable de vérifier l’existence des fichiers et de la preuve de licence sur disque. Revue statique seulement ; TypeScript/build/tests restent non exécutés faute de Node.js/npm.
## Cohérence des chemins médias
Le validateur prebuild refuse maintenant explicitement les segments de traversal (`..`) et les chemins encodés (`%`), comme le garde-fou runtime. Un septième test couvre le cas d’un chemin qui sort du dossier d’un template puis revient vers un fichier existant d’un autre template. Ce test n’a pas été exécuté faute de Node.js.
## Mode économie de données du lecteur
Le lecteur écoute `navigator.connection` quand disponible. Sur `saveData`, `2g` ou `slow-2g`, il coupe l’autoplay et met le préchargement à `none`; le lecteur natif permet toujours un démarrage manuel. Il attend la lecture de la préférence réseau avant d’autoriser autoplay ou metadata, afin d’éviter la requête initiale prématurée. La préférence reste facultative pour les navigateurs qui n’exposent pas cette API. Vérification navigateur et réseau non exécutée.
## Navigation clavier
La région défilante du feed a maintenant `tabIndex=0` et un focus visible, afin de pouvoir recevoir le focus clavier et utiliser le défilement natif du navigateur. Revue clavier réelle à exécuter dans les navigateurs cibles.
## Préférence reduced motion dynamique
Le lecteur écoute désormais `prefers-reduced-motion` au montage et aux changements système. Aucun autoplay n’a lieu avant que la préférence soit connue ; l’autoplay est suspendu si la réduction de mouvement est activée. Les commandes manuelles restent disponibles. Vérification réelle sur OS/navigateurs non exécutée.
## Abonnements de préférences navigateur
Les préférences réseau et mouvement utilisent `useSyncExternalStore` plutôt que des mises à jour d’état en effet, avec un instantané serveur `unknown` qui garde la vidéo à `preload=none` avant hydratation. Le changement de préférence est suivi ; la souscription `MediaQueryList` a un fallback pour Safari plus ancien. Toujours non exécuté dans un vrai navigateur.
## Page de détail partageable
Ajout de `/demo/{templateId}` comme page serveur de détail de la démo vidéo, avec métadonnées/canonical/aperçu Open Graph issus du manifeste et `notFound()` pour les IDs non publiés. Le feed lie à cette page. Bouton de partage natif, copie via clipboard en fallback, statut annoncé aux lecteurs d’écran. La page est explicitement une démo vidéo ; elle ne prétend pas être le site interactif du template. Le catalogue restant vide, aucune page produit n’est actuellement exposée. Compilation, métadonnées de rendu et partage navigateur non vérifiés.
Les posters de démo sont maintenant limités au format WebP et la page de détail démarre en préchargement 
one.

## Revue de contraste et des cibles
Calcul statique des couleurs opaques : primaire/fond 16,63:1 ; secondaire/fond 9,47:1 ; accent/fond 12,93:1 ; accent fort/fond 4,92:1. Le badge de marque avait 3,38:1 avec le texte blanc ; son texte est maintenant sombre pour atteindre 4,92:1. Les principales cibles tactiles sont portées à 44 px et les libellés fonctionnels à 12 px minimum. Transparence sur vidéo, zoom 200 %, captures et lecteur d’écran restent à vérifier en navigateur. Détail consigné dans `docs/DESIGN_SYSTEM.md`.
Les métadonnées canonical/Open Graph sont maintenant omises tant que PUBLIC_SITE_ORIGIN n’est pas explicitement configurée. Le code refuse les origins avec credentials, chemins, query/hash ou HTTP hors localhost. Aucun domaine n’est inventé.

PUBLIC_SITE_ORIGIN est aussi documentée dans le contrat de déploiement ; aucun canonical localhost n’est généré quand elle est absente.

## Heading hierarchy correction
- The public feed now has one visually hidden H1 that labels the catalog section; each published demo and the empty-state message use H2 headings.
- Matching desktop/mobile selectors were updated. Static source inspection confirms the intended tags/selectors; browser, screen-reader, responsive, and build checks remain unavailable.

### Quality review for this increment
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Partial | No content or CTA behavior changed; section now has an explicit heading. |
| UI | Not verified | CSS selectors updated; no rendered viewport review. |
| Frontend | Changed | Catalog H1 and demo/empty-state H2 hierarchy; compile not verified. |
| Firebase/backend | N/A | No backend touched. |
| Security | N/A | No data or permission behavior changed. |
| Performance | N/A | No media/network behavior changed. |
| SEO | N/A | No metadata or routes changed. |
| QA/SRE | Not verified | No build or browser test; Node/npm unavailable. |
| Compliance | N/A | No data processing or regulated flow changed. |

## Filter result announcement
- Active search/category filters now expose a polite, atomic status with the matching demo count or an explicit zero-result message.
- No announcement is rendered for the unfiltered catalog state. Static source inspection only; screen-reader/browser behavior is unverified.
- The empty-state container no longer adds a second live region; filtered zero results are announced by the single result-status region to avoid duplicate announcements.

## Build/runtime contract alignment
- The build validator now validates `captionsSrc` whenever the property is present, so empty strings and `null` cannot slip past the truthy check while the runtime filter rejects them.
- Static source inspection only; Node.js/npm are unavailable, so the validator and catalog tests were not executed.

## Caption path regression coverage
- Added a catalog test that rejects present `captionsSrc` values of an empty string and `null`; absence remains covered by the valid fixture.
- Ten catalog tests are authored, but none were executed because Node.js/npm are unavailable.

## Rights evidence content check
- Published manifests now fail build validation if their rights evidence file exists but is empty/whitespace. The check reads only the resolved in-project file after path containment is confirmed.
- A regression test covers a whitespace-only evidence file. Ten catalog tests are authored; none executed. Non-empty evidence still requires human license review.

## Production-only indexing policy
- Added shared public-origin validation, conditional homepage/demo canonical metadata, `robots.ts`, and `sitemap.ts`.
- Canonical URLs and sitemap entries require both Vercel production environment and a valid explicit `PUBLIC_SITE_ORIGIN`; preview/local metadata is noindex/nofollow. `robots.txt` allows crawling so bots can read those directives and advertises the sitemap only in production. Sitemap contains only the homepage and published catalog entries.
- No domain is configured, no deployment was made, and route output was not rendered. `robots.txt` is not authorization; no private pages/data are present in this public shell.

### Quality review for this increment
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | N/A | No user flow changed. |
| UI | N/A | No visible layout changed. |
| Frontend | Changed | Shared origin policy and Next metadata routes added; typecheck/build not run. |
| Backend/Firebase | N/A | No backend or Firebase integration. |
| Security | Partial | Preview/local indexing is suppressed; robots is not an access-control boundary. |
| Performance | N/A | No runtime asset or feed behavior changed. |
| SEO | Partial | Canonical, robots, sitemap, metadata are authored; no production origin or rendered verification. |
| QA/SRE | Not verified | Node/npm/Vercel unavailable; route rendering and deployment not checked. |
| Compliance | N/A | No data processing or legal claims introduced. |
- SEO correction: `robots.txt` does not block preview crawling, so crawlers can observe page-level `noindex`; preview access still requires separate Vercel protection.
- Hardening follow-up: production indexability now independently requires an HTTPS origin even if a localhost HTTP origin passes the development parser.

## Public not-found state
- Added a French `app/not-found.tsx` for unpublished demos and unmatched URLs, with noindex/nofollow and a 44px-minimum catalog return link.
- CSS styles the view for narrow and wide layouts. The source is not rendered in a browser; status code/streaming and screen-reader behavior remain to be verified.

### Quality review for this increment
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Partial | Honest unavailable state and route back to catalog; no recovery search. |
| UI | Not verified | Responsive CSS authored; no viewport review. |
| Frontend | Changed | Root not-found convention and metadata added; build unverified. |
| Backend/Firebase | N/A | No service integration. |
| Security | Partial | noindex/nofollow metadata; not access control. |
| Performance | N/A | No media or external requests added. |
| SEO | Partial | 404 metadata is noindex; response behavior not rendered/verified. |
| QA/SRE | Not verified | Node/browser checks unavailable. |
| Compliance | N/A | No user data or regulated flow. |

## Runtime error recovery state
- Added a client `app/error.tsx` boundary with a generic alert, retry action, and link back to the catalog. It does not render or log raw error details.
- The boundary covers errors in route segments below the root layout; root-layout failures need a separate `global-error.tsx` and are not covered by this increment.
- Responsive styles and 44px minimum actions were added. Typecheck/build and browser recovery behavior remain unverified because Node.js/npm are unavailable.

### Quality review for this increment
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Partial | Retry and a clear return path; no support contact or diagnostics shown. |
| UI | Not verified | Responsive CSS authored; no rendered viewport review. |
| Frontend | Changed | Next error boundary calls `reset`; build unverified. |
| Backend/Firebase | N/A | No service integration. |
| Security | Partial | Raw error details are not displayed or logged by this component. |
| Performance | N/A | No network or media behavior changed. |
| SEO | Partial | Error route behavior depends on HTTP error response; no deployment check. |
| QA/SRE | Not verified | Error-boundary behavior was not exercised. |
| Compliance | N/A | No personal data or regulated flow. |

## Public response security headers
- Added `nosniff`, strict-origin-when-cross-origin referrer policy, frame denial, and a Permissions-Policy disabling camera/microphone/geolocation in Next config.
- CSP was deferred pending a compatible policy for the actual Next.js output; HSTS awaits an approved controlled production domain. No headers were observed on an HTTP response.

### Quality review for this increment
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | N/A | No product flow changed. |
| UI | N/A | No rendered UI changed. |
| Frontend | Changed | Next config header rules authored; typecheck/build not run. |
| Backend/Firebase | N/A | No backend touched. |
| Security | Partial | Four browser policies configured; CSP, HSTS, CSP/frame-ancestors and live response checks remain open. |
| Performance | N/A | No network asset behavior changed. |
| SEO | N/A | No metadata or indexability changed. |
| QA/SRE | Not verified | No response or deployment could be inspected. |
| Compliance | N/A | No regulated data flow. |

## Root-layout error recovery
- Supersedes the earlier note that root-layout failures were uncovered: added `app/global-error.tsx` with its own HTML/body shell, inline fallback styling, generic alert, retry and catalog return.
- It does not import global CSS or render raw exception details. Typecheck/build and simulated root-layout failure remain unverified.

### Quality review for this increment
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Partial | Retry and catalog path are present; no support escalation flow. |
| UI | Not verified | Inline fallback authored; visual contrast/device check not run. |
| Frontend | Changed | Root error convention added; build unverified. |
| Backend/Firebase | N/A | No backend. |
| Security | Partial | Raw error is not displayed or logged. |
| Performance | N/A | No network requests. |
| SEO | Partial | Error page has title; not-found status/metadata not rendered. |
| QA/SRE | Not verified | Root failure was not simulated. |
| Compliance | N/A | No data flow. |

## Route loading state
- Added a root `app/loading.tsx` fallback with a polite live status and a no-animation layout. It appears while route content suspends under the root segment.
- Static content may resolve without showing the fallback; no route transition was rendered. Accessibility and behavior remain unverified without a browser.

### Quality review for this increment
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Partial | Route transition has a concise loading message; no progress estimate or backend wait exists. |
| UI | Not verified | Fallback styles authored; no rendered viewport review. |
| Frontend | Changed | Next loading convention added; build unverified. |
| Backend/Firebase | N/A | No asynchronous backend request. |
| Security | N/A | No data/permission behavior. |
| Performance | Partial | Static, no-animation fallback; timing not measured. |
| SEO | N/A | No index metadata changed. |
| QA/SRE | Not verified | Route suspension behavior not exercised. |
| Compliance | N/A | No data processing. |

## Video caption contrast surface
- Added a dark semi-opaque panel behind the video caption to reduce contrast variation caused by arbitrary video frames; retained the existing placement and controls.
- The source color has high expected contrast with the light text when composited over a bright frame, but its browser rendering and actual clip readability are unverified.

### Quality review for caption contrast
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Partial | Text now has a stable backing surface; visual prominence needs review. |
| UI | Changed | Caption surface, border, radius, and blur added. |
| Frontend | Changed | Responsive positions remain in existing rules; new shared caption surface is static. |
| Backend/Firebase | N/A | No backend. |
| Security | N/A | No security behavior changed. |
| Performance | Partial | Backdrop filter is used where supported; device impact unmeasured. |
| SEO | N/A | No metadata changed. |
| QA/SRE | Not verified | No browser, device, or contrast capture run. |
| Compliance | Partial | Contrast intent improved; WCAG result on real media not measured. |

## Mobile sound-control overlap correction
- Moved the sound toggle into the caption panel’s normal content flow, after the link and playback/data-saving status messages. Removed the old absolute bottom-right positioning that could overlap the caption on narrow screens.
- Static JSX/CSS review confirms the control is nested in `.video-caption` and no longer absolutely positioned; mobile layout and keyboard order have not been exercised in a browser.

## French interface copy correction
- Corrected accents and grammar in the data-saving status, playback error, and catalog footer strings.
- UTF-8 source inspection confirms the expected French strings; visual wrapping and screen-reader announcement behavior were not checked in a browser.
- Accessibility refinement: `global-error.tsx` keeps `<main>` as a landmark and places `role="alert"` on the short recovery message only; static inspection, screen-reader behavior unverified.

## Accent-insensitive search
- Feed query and searchable metadata are normalized to Unicode NFD, combining accents removed, and French-locale lowercased. Accented catalog terms can be found when typed without diacritics.
- Source inspection only; no interactive browser check or executable test was run.

## Keyboard skip link
- Added a visible-on-focus link before the public header/navigation that targets the focusable video-feed region.
- Source and target IDs were inspected statically; keyboard/focus behavior still needs browser and assistive-technology verification.

### Quality review for skip-link increment
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Partial | Keyboard users can bypass the header and filters. |
| UI | Not verified | Focus-visible appearance is authored; no browser check. |
| Frontend | Changed | Anchor targets the focusable feed region. |
| Backend/Firebase | N/A | No backend. |
| Security | N/A | No permissions or data behavior. |
| Performance | N/A | No scripts or requests added. |
| SEO | N/A | No metadata changed. |
| QA/SRE | Not verified | Keyboard traversal not exercised. |
| Compliance | N/A | No data processing. |

## Media file validation follow-up
- Build-time catalog validation now rejects media paths that resolve to directories or empty files, in addition to the existing path, containment, and extension checks.
- Added two regression cases: empty poster and directory ending in `.mp4`. The catalog suite now has 12 authored tests; none were executed because Node.js/npm are unavailable.
- This checks filesystem shape only; it does not inspect media signatures, decode the file, verify duration, or prove playback.

### Quality review for media-file validation
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Changed | Prevents unusable empty or directory assets from passing catalog validation; no published content added. |
| UI | N/A | No rendered interface changed. |
| Frontend | Changed | `statSync` enforces a non-empty regular file after real-path containment checks. |
| Backend/Firebase | N/A | No backend or storage pipeline. |
| Security | Partial | Path containment remains checked; media bytes and parser behavior are not inspected. |
| Performance | N/A | No runtime media processing added. |
| SEO | N/A | No metadata changed. |
| QA/SRE | Not verified | Two regression tests are authored but unexecuted; no build run. |
| Compliance | N/A | No applicant or personal data involved. |

## Strict catalog metadata follow-up
- Build-time and runtime validation now reject unknown properties on the entry and its sector/demo/media-rights metadata. This catches misspellings and unreviewed schema additions.
- Added one regression case covering unknown keys at the root and nested levels. The catalog suite now has 13 authored tests; Node.js/npm are unavailable, so it remains unexecuted.
- Build/runtime now read the same allow-lists from `content/catalog-schema.json`, removing the duplication risk.

### Quality review for strict catalog metadata
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Changed | Invalid published metadata is rejected before display. |
| UI | N/A | No rendered design changed. |
| Frontend | Changed | Runtime filtering and prebuild validation use explicit key allow-lists. |
| Backend/Firebase | N/A | No backend or stored records. |
| Security | Partial | Unknown fields are rejected; this does not validate media bytes or access control. |
| Performance | N/A | No media or rendering work added. |
| SEO | N/A | No metadata output policy changed. |
| QA/SRE | Not verified | Regression authored but not executed; no build run. |
| Compliance | N/A | No personal data processing. |

## Empty production catalog guard
- Build validation now rejects `VERCEL_ENV=production` when there is no published catalog entry. Empty catalogs remain valid for local development and preview so the honest empty state can be worked on without inventing demos.
- Added a regression covering development acceptance and production rejection. Catalog tests now total 18; no test/build ran because Node.js/npm are unavailable.
- This gate ensures at least one entry is marked published; the existing per-entry validator still checks family approval, deployment status, local media, and rights evidence.

### Quality review for production catalog guard
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Changed | Empty production deploys are stopped before they can present an empty discovery feed. |
| UI | N/A | No rendered UI changed. |
| Frontend | Changed | Build validator branches on Vercel production environment. |
| Backend/Firebase | N/A | No service integration. |
| Security | Partial | Prevents publishing an empty experience; it does not prove a demo is playable. |
| Performance | N/A | No runtime work added. |
| SEO | Partial | Avoids shipping an empty, nominally indexable production catalog. |
| QA/SRE | Not verified | Regression authored but unexecuted; production build not run. |
| Compliance | N/A | No data processing. |

## WebVTT caption structure check
- Published caption assets now need the UTF-8 WebVTT header followed by a blank separator and at least one timestamped cue with non-empty text. Seconds/minutes must be in range, cue ends must follow starts, and cue starts must be ordered; the asset must also pass local-path, extension, regular-file, and non-empty checks.
- Added passing/rejection cases for invalid headers, missing cues, missing header separator, out-of-range timestamps, reversed/equal cue bounds, out-of-order cues, and invalid UTF-8 bytes. The passing fixture covers BOM, CRLF, header metadata, and both timestamp forms. The catalog suite now has 20 authored tests; none were executed.
- This is a lightweight structural check, not a complete WebVTT parser. Full cue syntax, subtitle quality, and browser rendering remain unverified. Header separation and cue ordering follow the [W3C WebVTT syntax](https://www.w3.org/TR/webvtt1/#webvtt-file-structure).

### Quality review for caption validation
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Partial | Empty or obviously malformed caption tracks are rejected; caption quality is not assessed. |
| UI | N/A | No rendered component changed. |
| Frontend | Changed | Build validation checks header, cue timing shape/range/order, and non-empty cue text. |
| Backend/Firebase | N/A | No backend. |
| Security | Partial | Local path checks remain; no arbitrary caption fetch or full parser. |
| Performance | N/A | Build-time file read only. |
| SEO | N/A | No metadata change. |
| QA/SRE | Not verified | Regression cases are authored but unexecuted; caption playback not tested. |
| Compliance | N/A | No personal data processing. |

## Runtime duplicate-ID defense
- The runtime now hides every otherwise-valid published entry whose `templateId` occurs more than once. This agrees with the build validator and avoids ambiguous `/demo/{templateId}` resolution during local development.
- The duplicate filter is now an isolated module shared by the runtime and an executable regression case. Both the build and runtime duplicate tests are authored but unexecuted because Node.js/npm are unavailable.

### Quality review for duplicate-ID defense
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Changed | Ambiguous demos are not presented. |
| UI | N/A | No layout changed. |
| Frontend | Changed | Runtime counts valid published entries by stable ID and hides duplicates. |
| Backend/Firebase | N/A | No service integration. |
| Security | Partial | Reduces ambiguous route selection; no access-control boundary is involved. |
| Performance | Partial | One linear count pass and one filter pass; no measurement performed. |
| SEO | Changed | Ambiguous entries are omitted from the runtime catalog and its sitemap source. |
| QA/SRE | Not verified | Duplicate build/runtime tests are authored but unexecuted; browser route behavior remains unverified. |
| Compliance | N/A | No personal data processing. |

## Viewport-unit fallback
- Added `@supports not (height:100svh)` fallbacks using `vh` for the feed, detail video, not-found, loading, and error screens; short-height feed items no longer retain a fixed 600px minimum on browsers without `svh`.
- Updated the responsive matrix with the real local shell state and the required short-viewport/browser checks.
- Static CSS/source review only. No browser, test runner, or build was available.

### Quality review for viewport fallback
| Role | Result | Evidence / limit |
|---|---|---|
| Product/UX | Partial | Screens retain a viewport-sized layout where `svh` is unsupported; actual device behavior is unknown. |
| UI | Changed | Added viewport-unit fallback declarations. |
| Frontend | Changed | `@supports` and short-height mobile overrides are present. |
| Backend/Firebase | N/A | No backend. |
| Security | N/A | No security-sensitive behavior. |
| Performance | N/A | No scripts or assets added. |
| SEO | N/A | No metadata changed. |
| QA/SRE | Not verified | Browser matrix, screenshot, and build not run. |
| Compliance | N/A | No data processing. |
