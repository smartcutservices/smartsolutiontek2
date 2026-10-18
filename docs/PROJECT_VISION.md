# Smart Solutions Tech — vision produit
Date : 2026-10-11. Cadrage fondé sur le document maître V0.9.

## Promesse
Permettre à une personne non technique de découvrir un modèle de site, l’acheter, le personnaliser par étapes et gérer son activité depuis un espace simple. Les sites publiés restent hébergés par Smart Solutions Tech.

## Parcours directeur validé
1. Accueil public sous forme de flux vidéo immersif de templates, catégories horizontales et aperçu réel.
2. Choix d’une offre et paiement du template avant le questionnaire.
3. Déblocage après confirmation serveur ; questionnaire conditionnel, une carte à la fois, sauvegarde et aperçu.
4. Publication et gestion dans « Profil → Mes projets », avec dashboard adapté au métier.
5. Dashboard super-administrateur indépendant du site public.

Le paiement d’accès au template est distinct des paiements que le site client peut accepter. Ces derniers empruntent la couche SmartCut côté serveur. Un retour navigateur ne confirme jamais un paiement.

## Principes
Simplicité progressive, mobile-first, accessible et réversible. Moteurs métier séparés des templates et configurations. Isolation serveur des tenants, données privées protégées par règles Firebase. SEO, performance, confidentialité, sécurité et coûts dès la conception. Ne publier que des templates réellement déployés, testés et compatibles. Les recommandations du maître ne sont pas des décisions validées.

## Périmètre
Socle commun, identité et isolation, découverte vidéo/catalogue, administration, questionnaire, contrat paiement, achat, runtime de publication, dashboards, moteurs métiers, puis catégories approuvées.

## À décider
Prix/renouvellements, marchand légal et reversements, retraits, catégories de lancement, domaines, budgets, régions, rétention et export ZIP. Voir DECISIONS.md.
Une catégorie n’est couverte que par un template opérationnel testé, pas une maquette ou fiche catalogue.

## Profils produit à cadrer
- Visiteur : découvre le flux, consulte des démos et offres publiques ; compte non requis pour l’aperçu.
- Propriétaire de projet : achète une offre, personnalise et administre ses sites, voit uniquement ses ressources.
- Administrateur Smart Solutions Tech : gère templates/offres/modération et opérations selon privilèges ; frontend distinct, contrôle côté serveur.
Les collaborateurs sont une évolution à décider, pas un rôle MVP validé.

## Taxonomie de travail
Catégorie principale = groupe de besoins qui doit recevoir un template fonctionnel si retenu au lancement. Sous-catégorie = spécialisation sectorielle pouvant réutiliser le même moteur et parfois le même template. Cette définition est une proposition ; faire approuver la liste finale avant P11.
