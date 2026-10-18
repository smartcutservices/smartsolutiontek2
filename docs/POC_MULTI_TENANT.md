# Protocole P0.8 - PoC de routage multi-tenant Vercel

**Etat : prepare, non execute.** Date : 2026-10-12. Ce document prepare la preuve de faisabilite demandee par le document maitre et `docs/NEXT_TASK.md`. Il ne prouve pas que Vercel, DNS ou TLS fonctionnent pour le compte cible.

## Question a trancher

Un seul deploiement `sites-runtime` peut-il rendre trois sites fictifs differents selon le hostname, sur deux domaines autorises, sans fuite entre tenants, avec navigation directe/refresh, HTTPS, SEO, metadonnees et cache correctement isoles ?

## Preconditions obligatoires

Ne pas commencer l execution avant :

1. Gate P0 ferme et validation explicite du proprietaire.
2. Projet Vercel de test identifie dans une equipe/compte confirme, sans rattachement au projet de production.
3. Environnement Firebase dev/staging confirme ou fixture locale strictement sans donnees personnelles. Aucun projet possiblement partage.
4. Deux domaines de test dont la propriete et l usage sont autorises. Les noms ne sont pas choisis ici et aucun achat n est autorise.
5. Plan de facturation, limites, regions et alertes verifies en lecture seule; budget du PoC approuve.
6. Rollback, acces prive des previews et interlocuteur operationnel identifies.

Si une precondition manque, le PoC reste a l etat prepare et aucune integration DNS/Vercel/Firebase n est tentee.

## Jeu de donnees fictif

Creer trois enregistrements en memoire ou dans un environnement isole; tous les marqueurs sont inventes et ne representent aucune entreprise ou personne reelle.

| tenantId | siteId | Marqueur de page unique | Host de test |
|---|---|---|---|
| `tenant-cedar` | `site-cedar` | `POC-CEDAR-ONLY` | `cedar.<domain-A>` |
| `tenant-coral` | `site-coral` | `POC-CORAL-ONLY` | `coral.<domain-A>` |
| `tenant-amber` | `site-amber` | `POC-AMBER-ONLY` | `amber.<domain-B>` |

`<domain-A>` et `<domain-B>` sont des placeholders. Deux sites partagent le premier domaine parent; le troisieme utilise l autre domaine. Les hosts reels sont inscrits dans le rapport seulement apres autorisation.

## Contrat de resolution a eprouver

`hostname normalise -> domaine verifie -> site publie -> tenant proprietaire -> revision active`.

- Le hostname recu par le serveur est la seule cle publique initiale. Un `tenantId` dans query, body ou segment URL ne selectionne jamais un tenant.
- Refuser hostname absent/inconnu, domaine en attente/non verifie, site non publie et collision host. Aucun fallback vers un site par defaut.
- N utiliser que les headers d origine documentes pour la plateforme. Tester explicitement `Host`/forwarded-host forge et ne jamais croire un header arbitraire du client.
- Toute lecture privee est autorisee cote serveur par `uid`, role, `tenantId` et `siteId`, puis par les Rules Firebase. Les pages publiques n exposent que la revision publiee.
- Les donnees, assets, canonicals, sitemap et cles de cache restent partitionnes par site/tenant/revision. Pas de cache partage par chemin seul.

## Parcours a executer

1. Associer les trois hosts autorises au meme deploiement non-production et attendre la validation TLS fournie par la plateforme.
2. Ouvrir chaque hostname directement, puis recharger la page et naviguer vers une route imbriquee. Confirmer le bon marqueur et la meme revision apres refresh.
3. Ouvrir A, B et C successivement dans la meme session et des sessions separees. Aucun titre, contenu, image, canonical ou sitemap d un autre host ne doit apparaitre.
4. Rejouer les requetes avec host inconnu, domaine non verifie, majuscules, port explicite, point final, header forwarded forge, query `tenantId` modifie et chemins de traverssee. Refuser ou normaliser selon un contrat ecrit; aucune resolution ambiguë.
5. Comparer les reponses apres publication d une nouvelle revision et apres rollback. Les caches ne doivent jamais servir la revision d un autre site.
6. Verifier HTTPS, certificat, redirection HTTP->HTTPS, canonical absolu par host, robots, sitemap et Open Graph par site. Les previews et les hosts inconnus sont noindex et absents du sitemap public.
7. Inspecter les logs pour confirmer l absence de reponses, courriels, tokens et valeurs sensibles; relever uniquement les codes de reponse, latences, host de test et resultat du cas.

## Matrice minimale de preuve

| Cas | Resultat requis |
|---|---|
| 3 hosts connus, racine et route imbriquee | Bon site et marqueur uniquement; direct load et refresh reussissent |
| 2 sites sur domain-A, 1 sur domain-B | Isolation stricte des contenus, assets et metadata |
| Host inconnu ou non verifie | 404 generique noindex; aucun site par defaut |
| Tenant/siteId fourni par le navigateur | Ignore ou refuse; ne change jamais la resolution ni l autorisation |
| Header de proxy forge | Ne peut pas changer le hostname de confiance |
| HTTPS/TLS | Certificat valide sur chacun des trois hosts et HTTP redirige |
| Canonical, robots, sitemap, Open Graph | Host et site corrects; aucun host prive ou autre tenant |
| Cache chaud puis bascule A/B/C | Aucune fuite inter-site; revision et invalidation exactes |
| Publication puis rollback | Nouvelle revision visible pour le bon site seulement; ancienne revision restaurable |

## Preuves a joindre au resultat

- Identifiant du projet Vercel non-production, equipe/plan et date de verification, sans secret.
- Domaines autorises, etat TLS, mapping host/site et revision testee.
- Captures expurgees ou sorties HTTP sans cookies, tokens ou donnees personnelles.
- Resultat de chaque ligne de la matrice, versions/outils, cache observe et limitations.
- Revue des couts/limites sans activer un plan; decision go/no-go du proprietaire.

Le resultat est un echec si un seul cas permet une fuite ou une resolution ambigue. Corriger et rejouer toute la matrice avant d invoquer le Gate P8. Ce PoC P0.8 ne vaut ni preuve du Gate P8 complet, ni autorisation de production.