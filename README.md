# Smart Solutions Tech

Monorepo de la plateforme Smart Solutions Tech : aperçu de modèles de sites, édition visuelle directe et outils locaux de démonstration.

## Applications

- `apps/public-web` : galerie et aperçus de modèles. La page d’inscription en ligne propose un parcours de démonstration en cinq étapes.
- `apps/admin-web` : interface d’administration en cours de développement.
- `apps/sites-runtime` : runtime de sites en cours de développement.

Les aperçus et les données de formulaires sont des démonstrations. Aucun formulaire ne transmet de candidature et aucun service de production n’est configuré.

## Développement local

Prérequis : Node.js 20.9 ou plus récent et npm.

```powershell
npm install
npm run dev:public
```

Vérifications disponibles : `npm test`, `npm run typecheck` et `npm run lint`.

## Configuration et publication

`.env.example` fournit des noms de variables avec des valeurs de démonstration. N’ajoute jamais de secrets ou de fichiers `.env` au dépôt. Le document maître reste local : il contient une clé Firebase Web dont les restrictions et quotas n’ont pas été vérifiés. Les services Firebase, les paiements et les déploiements de production ne sont pas configurés par ce dépôt.
