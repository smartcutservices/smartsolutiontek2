# Rapport — contrat local du module inscription

## Objectif
Poser le modèle de configuration initiale « inscription en ligne » prévu par le maître, sans collecter de candidatures, créer un faux site d’établissement, téléverser de pièces, traiter de paiements ou publier une configuration.

## Fichiers
- `apps/public-web/features/registration/registration-config.mjs` : validation structurelle d’une configuration brouillon.
- `apps/public-web/features/registration/registration-types.ts` : types TypeScript correspondants.
- `apps/public-web/tests/registration-config.test.mjs` : seize tests de contrat écrits, non exécutés.

## Règles couvertes
- Version de schéma fixe `1.0.0` et statut `draft` seulement.
- Identite institutionnelle, coordonnees, logo reference et liens sociaux HTTPS ; programmes avec niveau/admissibilite, disponibilite permanente ou dates ISO, capacite et liste attente.
- Mode individuel/multiple, politique anti-doublon et message de confirmation ; champs text/email/telephone/date/select/checkbox/fichier ; IDs/options uniques.
- Conditions limitées à un champ select inconditionnel antérieur, sans code arbitraire ni branche circulaire.
- Consentement confidentialité et conditions obligatoires ; consentement marketing toujours facultatif.
- Inscription gratuite sans prix ni fournisseur de paiement ; mode payant exige devise au format 3 majuscules, prix décimal en chaîne par programme et divulgation de frais. Aucun fournisseur ou endpoint n’est défini.
- Les champs fichier nécessitent type MIME, taille maximale et durée de rétention configurés. Les politiques upload réelles, sniffing MIME, antivirus, stockage, accès tenant et suppression ne sont pas implémentés.

## Vérifications et limites
- Seize cas de test ont été écrits pour le chemin valide, paiements, IDs, conditions, upload, statut publication, capacité, disponibilité permanente et consentements.
- Aucun test, lint, typecheck ou build exécuté : Node.js/npm absents.
- La validation ne vaut ni conformité juridique ni validation métier. La configuration n’est pas encore branchée au formulaire public, au wizard, au backend, au stockage ou au dashboard.
- Aucune donnée réelle ni configuration de site n’est fournie.

## Suite
Exécuter les seize tests dans Node.js, compléter les champs d’identité/branding et le contrat de données selon décisions P0, puis relier le validateur au wizard uniquement après validation du parcours et des politiques de collecte.

## Strict-schema extensions
Additional checks reject unknown versioned properties, non-HTTPS social URLs, active-content MIME types, mandatory marketing consent, duplicate MIME entries and malformed select options. Paid amounts remain decimal strings to avoid binary floating-point rounding. Waitlist and duplicate handling are configuration values only; no processing is implemented.
The TypeScript draft now uses discriminated unions: scheduled programs require both timestamps, select fields require options, and marketing consent must be optional at compile time.
Unknown properties are also rejected inside individual select options and `showWhen` rules, preserving the versioned schema boundary. This change was inspected statically; tests were not run because Node.js/npm are unavailable.
The configurable MIME policy now uses a positive allowlist (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`) rather than a denylist. This only constrains configuration; byte-level content detection, malware scanning, authorization, private storage and deletion remain server-side work.

## Quality review for this local increment
| Role | Result | Evidence / limit |
|---|---|---|
| UX/UI | N/A | No user-facing flow changed; this remains a draft schema. |
| Frontend | Changed | Configuration validator narrowed to a positive MIME allowlist; static inspection only. |
| Backend/Firebase | N/A | No backend, Firebase rules, storage, or submission path exists in this increment. |
| Security | Partial | Unknown nested properties are rejected and configured MIME types are allowlisted; received bytes and access controls are not verified. |
| Performance | N/A | No runtime rendering or network behavior changed. |
| SEO | N/A | No public route or metadata changed. |
| QA | Not verified | Node.js/npm are absent; tests, lint, types, and build were not run. |
| Operations | N/A | No external service or deployment was changed; local Git branch isolation is unavailable because Git is absent. |
| Compliance | Not verified | No legal review, retention approval, or real data processing is included. |
