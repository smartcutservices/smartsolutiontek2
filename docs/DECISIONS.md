# Registre des décisions

## Décision produit du propriétaire — édition du modèle dans l’aperçu (2026-10-15)
Le parcours principal de création est l’édition visuelle directe : l’utilisateur choisit un modèle, l’ouvre, clique sur « Éditer le modèle », puis modifie son contenu dans l’aperçu (textes, images, logo, liens, couleurs et sections). Le questionnaire n’est plus l’entrée ni le mode principal de personnalisation. Il peut rester une capacité facultative pour les données métier quand elle est utile. Cette décision du propriétaire remplace les passages antérieurs du prompt maître qui imposent le questionnaire comme parcours principal. Elle n’autorise pas la publication, les paiements ou le stockage serveur.

## Mise a jour du proprietaire — Vercel et Firebase (2026-10-12)
- Vercel : le compte est neuf, sans projet; le proprietaire autorise son utilisation pour SST. Etat rapporte par le proprietaire, non verifie en console.
- Firebase smartcutservices-9ce54 : le proprietaire autorise l'ajout de SST a condition de ne pas casser SmartCut. Cette autorisation persiste; l'inventaire de production doit preceder toute modification et aucun changement global des regles/Functions n'est autorise par cette phrase.
- GitHub demeure differe; le travail local continue.
- Preuves et gates : docs/reports/P0-reconciliation-2026-10-12.md.
Date : 2026-10-11. Source : maître V0.9 et audit GitHub lecture seule.

## Validé par le maître
| Sujet | Décision |
|---|---|
| Produit | SaaS multi-sectoriel de création guidée |
| UX | Feed vidéo immersif à l’accueil, catégories, aperçu |
| Achat | Paiement template avant personnalisation ; confirmation serveur |
| Wizard | Une question, conditionnelle, sauvegardée |
| Client | Dashboard dans l’application publique, Mes projets |
| Admin | Frontend, déploiement et hôte séparés |
| Stack cible | Next.js/React/TypeScript, Vercel, Firebase Auth/Firestore/Functions/Storage, GitHub, GSAP, Three/R3F |
| Paiements métiers | Couche SmartCut côté serveur ; aucun secret MonCash côté client |
| Hébergement | Sites clients hébergés par la plateforme |
| Qualité | WebP éligible, responsive, SEO, sécurité/performance dès conception |

## Observé, sans devenir décision cible
Le dépôt privé smartcutservices/smartcutservices contient un sous-projet SST statique et Functions intégrées à SmartCut. Le module de paiement utilise des internes MonCash du backend commun ; aucune API externe n’a été observée. Un minimum de payout de 500 HTG est codé, non approuvé comme règle produit. main est non protégée selon GitHub ; aucun workflow GitHub n’apparaît dans l’arbre consulté. Ces constats décrivent l’existant uniquement.

## À confirmer / arbitrer
1. Le dépôt cible dédié est choisi ; quel code SST existant est en production et doit éventuellement être migré ?
2. Firebase smartcutservices-9ce54 associé/partagé ? Quelles ressources SmartCut ?
3. Accès Vercel smartcutconnect509-7528, projets, domaines et plan.
4. Quel code SST du dépôt SmartCut existant est réellement utilisé et doit être réutilisé, migré ou réécrit dans la cible Next.js/Vercel ?
5. Contrat SmartCut : auth, sandbox, idempotence, callbacks, statut, remboursements/settlement.
6. Autorisation légale/contractuelle fonds tiers, soldes/retraits.
7. Prix/formules, renouvellement, commissions, frais, taxes, remboursements/suspension.
8. Catégories principales/MVP ; langues, juridictions, rétention, données sensibles.
9. Budget Firebase/Vercel, régions, volumes/limites vidéo, notifications/export/licences/collaborateurs.
10. Le document s’appelle V0.9 mais son en-tête annonce V0.8 avant addendum V0.9 : quelle version canonique ?

## Recommandations non approuvées
Monorepo possible avec apps public/admin/runtime ; Firebase dev/staging séparé, Emulator Suite, rules deny-by-default ; ledger append-only ; 3D/GSAP à la demande. Aucune recommandation architecturale n'est approuvée ; la décision du propriétaire concernant le dépôt dédié figure ci-dessous.

## Décision utilisateur — dépôt source
Le projet utilisera un dépôt GitHub dédié `smartsolutiontek`, distinct du dépôt SmartCut. Le dépôt homonyme appartenant à `leo50945` n’est pas celui demandé. La création distante n’a pas pu être réalisée dans cette session : aucun outil exposé ne crée un dépôt et `git`/`gh` sont absents. L’import des fichiers puis l’association Vercel restent à réaliser après création sous le compte du propriétaire.

## Cadrage P0.5 tiré du contrat produit prioritaire (Addendum V0.7)

| Sujet | Statut dans le document maître | Conséquence pour le cadrage |
|---|---|---|
| Profils initiaux | Visiteur, propriétaire de projet et administrateur sont à définir ; collaborateurs sont futurs | Profils identifiés ; matrice de permissions détaillée encore à établir |
| Premier module | Inscription en ligne est le module initial validé | À retenir comme premier parcours métier candidat au MVP |
| E-commerce | Mono-produit et multi-produits envisagés/validés comme familles | Ne présume pas leur inclusion dans le tout premier lancement |
| Catégories secteur | 50 catégories listées comme candidates dans l’Addendum V0.5 | Voir `TEMPLATE_CATALOG.md` ; aucune sélection finale n’est approuvée |
| Parcours | Vidéo-first, découverte/aperçu avant paiement, achat avant personnalisation ; wizard conditionnel par cartes | Contraintes produit validées à conserver dans le MVP |
| Espaces clients | Compte, profil, Mes projets et dashboard par projet ; admin distinct | Contraintes de séparation déjà validées |
| Collaborateurs | Capacités avancées envisagées plus tard | Hors premier périmètre, sauf décision contraire |
| Paiements / monétisation | Paiement SmartCut centralisé prévu ; frais, prix, règlements et obligations restent à décider | Aucun flux financier réel ni barème à implémenter avant contrat et revue |

Le phasage opérationnel détaillé de l’Addendum V0.7 prime sur les anciens phasages du corps historique. La liste et l’ordre définitifs du MVP nécessitent encore validation du propriétaire.



## Décision de portée locale — prototype public
Date : 2026-10-11. Le propriétaire a demandé de commencer le code en local sans attendre la création GitHub. Cette autorisation couvre le développement local du projet, dont le shell public et les contrats brouillons du premier module ; elle ne ferme pas P0 et n'autorise aucune mutation Firebase/Vercel, intégration de paiement réelle, publication, ni données ou médias fictifs. La direction de couleurs sombre/vert du prototype est une proposition UI locale, pas une marque approuvée.

## Mise à jour — GitHub différé
Le propriétaire a confirmé que GitHub n’est pas nécessaire pour l’instant et a demandé de poursuivre localement. Le dépôt dédié envisagé précédemment n’est pas créé ni connecté ; ne pas lancer d’action GitHub tant que le propriétaire ne reprend pas ce volet. `C:\Users\mesja\Music\smartsolutiontek` reste le dossier de travail autorisé. Cette mise à jour ne change pas la cible future Vercel/Firebase ni les gates requis avant intégration.

## Local P3 catalogue controls
Les options de tri populaires/activité et leur sélecteur ont été retirés du shell tant qu’aucune métrique validée ni personnalisation d’activité ne les rend fonctionnels. Le tri chronologique décroissant reste l’ordre par défaut calculé à partir de `publishedAt`. Les filtres, la recherche et les familles proposées restent en place.

Quand le jeu de résultats change, le conteneur défilant du feed revient à `scrollTop = 0` et active la première démonstration disponible ; le test dans un navigateur reste à faire.

Les validateurs build/runtime lisent leurs listes communes de propriétés depuis `content/catalog-schema.json` ; toute extension doit être explicite et couverte par une régression.

Le runtime n’affiche aucune entrée publiée dont le `templateId` n’est pas unique, afin qu’une route `/demo/{templateId}` ne puisse pas correspondre à plusieurs versions.
Ce filtrage est isolé dans `app/catalog-runtime.mjs`, partagé avec le runtime et directement couvert par un test de régression.

## Local P3 SEO policy
The public app emits canonical/indexable metadata, robots sitemap/host, and published-demo sitemap entries only when `VERCEL_ENV=production` and an explicit valid `PUBLIC_SITE_ORIGIN` exists. Local/preview HTML is noindex/nofollow but remains crawlable so bots can read the directive. This is a local code policy only; no origin, Vercel variable, domain, or deployment has been configured.
- Local P3 SEO follow-up: `app/icon.svg` follows the prototype header mark only; it does not establish an approved company logo.
- Local P3 error handling: use one root not-found page for both unknown catalog URLs and unpublished demos; this introduces no publication or access behavior.
- Local P3 runtime errors use generic retry/return screens in `error.tsx` and `global-error.tsx`; raw exception details are not exposed or logged.
- Local public-web baseline uses nosniff, strict-origin-when-cross-origin, frame denial, and disables unused browser APIs; CSP/HSTS are intentionally not active until compatibility/domain review.
- The local public app has separate segment (`error.tsx`) and root-layout (`global-error.tsx`) generic recovery screens; both avoid logging/rendering raw exceptions.
- Local public route loading uses a concise polite status without animation; it does not imply a backend request or progress estimate.

## Moteur questionnaire local — première unité pure
Date : 2026-10-11. Ajout d’un moteur déterministe local pour calculer les cartes visibles, la prochaine question sans réponse, le progrès basé sur la branche active et supprimer les réponses d’une branche devenue invisible après changement parent. Les validations client restent indicatives ; tout envoi futur devra être revalidé côté serveur. Les fichiers ne sont jamais considérés comme validés par ce moteur. Aucun stockage, collecte, authentification, backend ou publication n’est ajouté.

## Composant carte de questionnaire isolé
Date : 2026-10-11. Ajout d’un composant contrôlé, une question par écran, progression, retour, récapitulatif et adaptation de branche. Il n’est référencé par aucune route. Il n’accorde aucun accès à la personnalisation et doit être monté derrière un entitlement vérifié côté serveur après paiement confirmé, conformément à la phase 7. Les réponses restent dans l’état du parent et ne sont pas persistées ; aucune soumission n’existe.

## Contrat versionné du questionnaire universel (local)
Date : 2026-10-11. Ajout d’un contrat déclaratif local avec 21 types, version de schéma et de question, règles AND référant uniquement des questions antérieures, retrait des réponses de branche devenue invisible et validation locale des formes de réponses. Les bornes de montants restent côté serveur jusqu’à clarification des règles devise/précision ; les fichiers exigent signature et contrôle serveur. Les permissions, tags analytiques, valeurs par défaut et answerMapping ne constituent pas une politique d’accès ni un moteur d’exécution ; aucune fonction ou expression fournie n’est évaluée. Les schémas ne sont pas stockés dans Firestore et ne sont pas intégrés au composant. Cela matérialise une fondation, pas l’acceptation de la structure complète des données.

## Migration questionnaire locale
Date : 2026-10-11. Les migrations du wizard sont déclaratives et versionnées. Réponses renommées/options mappées ne sont transformées que par opérations explicites ; une réponse retirée est conservée à part avec une raison, pour revue humaine et éventuelle récupération. Le résolveur local exige une décision conserver/écarter par réponse orpheline, des réponses cibles valides et une approbation explicite ; il ne persiste ni n’applique ce résultat. Les migrations n’exécutent aucun code arbitraire, ne sont pas auto-publiées et ne sont pas appliquées à des projets ou stockages.

## Mise à jour de portée — Phase 0 et GitHub différé
Date : 2026-10-11. Le propriétaire demande de poursuivre en local et reporte GitHub pour l'instant. Cela reporte la création du dépôt distant et toute connexion GitHub; la cible GitHub inscrite dans l'addendum prioritaire V0.9 demeure la cible d'architecture. Le propriétaire a demandé d'exécuter le prompt maître : la mission en cours est donc l'audit P0, et P1 attend la validation explicite du gate. Les détails et preuves locales sont dans `docs/PHASE_0_AUDIT.md`.

## Decision du proprietaire - couverture sectorielle locale
Date : 2026-10-12. Le proprietaire demande les templates et questionnaires dynamiques pour tous les secteurs du document maitre. Le perimetre de travail local couvre les 50 candidates V0.5 et six familles V0.9 absentes : institutions/collectivites, industrie/B2B, services funeraires, securite, energie/environnement et services publics. Le catalogue local compte donc 56 prototypes candidats. Cette instruction autorise les prototypes locaux seulement; elle ne vaut pas validation finale des secteurs pour le lancement, ni autorisation de paiement, collecte, persistance, integration Firebase/Vercel ou publication.
## 2026-10-12 — Tarifs publics, sans inférence sur les comptes
Les tarifs publics Vercel/Firebase ont été vérifiés et consignés dans `INFRASTRUCTURE.md`. Repères Vercel Hobby/Pro, quotas Firebase et exigence Blaze pour Cloud Storage sont des faits tarifaires généraux. Aucun plan ou compte réel n’est vérifié, aucun budget n’est approuvé et aucun plan/service ne sera modifié sur cette base seule.

## Décision de versionnement local du questionnaire sectoriel
Date : 2026-10-12. Le schéma sectoriel passe de 1.2.0 à 1.3.0 pour ajouter une question facultative de sélection des sections. Les réponses alimentent la navigation et les sections de l’aperçu local. Les brouillons 1.0.0, 1.1.0 et 1.2.0 sont acceptés par migration additive; seules les valeurs compatibles et visibles restent dans le brouillon actif. Cette décision n’active ni personnalisation publiée, ni persistance serveur, ni paiement.
## Mise à jour de portée — Vercel, Firebase et travail local
Date : 2026-10-12. Le propriétaire indique que le compte Vercel est neuf et autorise son usage pour Smart Solutions Tech. Il autorise l’ajout de ressources SST dans Firebase existant, avec obligation de préserver toutes les ressources SmartCut. Aucune suppression, migration, reconfiguration SmartCut, modification de facturation ou action distante n’est réalisée avant connexion, inventaire, preuve d’isolation et contrôle du plan. GitHub reste différé; les prototypes locaux de tous les secteurs sont autorisés.
## Décision de questionnaire — préférence de paiements clients
Date : 2026-10-12. Le schéma passe en 1.4.0 et recueille un choix oui/non sur l’encaissement des clients finaux; ses questions de détail ne sont visibles que si la réponse est oui. Ce choix est distinct de l’achat du template. Aucune transaction, tarification, devise ou activation réelle n’est mise en œuvre; SmartCut reste soumis au contrat, sandbox et gate P6.
## Stub SmartCut en attente du contrat externe
Date : 2026-10-12. Creation d'un adaptateur local inert sous `functions/src/contracts/`. Les capacites internes rejettent avec `SMARTCUT_NOT_CONFIGURED` et n'emettront aucun succes. Les noms de methodes ne definissent aucun endpoint externe. Cette preparation ne leve aucun gate P0/P6 et ne constitue pas une integration serveur deployable.
### Mise à jour du périmètre des profils candidats — 2026-10-12
Après comparaison du tableau de taxonomie P0.7 (56 familles candidates) au registre local, 11 familles sans profil dédié ont été ajoutées. Le registre de travail contient 67 profils candidats et questionnaires. Cette extension augmente la couverture de travail; elle ne valide pas la taxonomie de lancement et ne déclare aucun template opérationnel ou publiable.
### Ajustement final de la couverture candidate — 2026-10-12
Épiceries/marchés et petites entreprises locales ont été identifiées comme catégories P0.7 distinctes et ajoutées avec leurs propres IDs. Le total courant est 69 profils candidats. Aucun ne devient approuvé ni opérationnel par cette mise à jour.
### Version questionnaire sectoriel 1.5.0 — 2026-10-12
L’aide de la question conditionnelle « paiement des clients » est contextualisée par secteur. Les IDs/options restent stables afin de préserver les brouillons; les nouveaux avertissements n’activent aucun paiement. Le schéma 1.5.0 migre de façon additive depuis 1.0.0–1.4.0. Aucun contrat SmartCut ou parcours de règlement n’est ajouté.
### Mise à jour locale — compositions de preview par moteur
Date : 2026-10-12. Les previews des 69 profils utilisent cinq structures visuelles correspondant aux flows déclarés dans `registry.ts`. Cela améliore la distinction entre familles candidates sans approuver la taxonomie ni prétendre livrer les moteurs métier. Les interactions de commande, réservation, candidature et contact restent absentes; toute conversion en template publiable devra fournir un moteur opérationnel, un contrat de données, les protections serveur et une QA spécifique.

### Mise à jour locale — avertissement de branche
Date : 2026-10-12. Lorsqu’un changement masque une ou plusieurs réponses renseignées, le wizard avertit l’utilisateur et permet d’annuler pour restaurer l’ancien brouillon. Les réponses sont toujours exclues du parcours actif et de l’aperçu tant que la branche est masquée. Cette modification améliore la réversibilité demandée par P5, sans sauvegarde historique serveur ni publication.

### Mise à jour locale — navigation du feed
Date : 2026-10-12. Les contrôles précédente/suivante sont ajoutés au feed des seules démos publiées, avec tabulation native et activation clavier. Ils ne créent ni likes, commentaires, achats, ni interactions fictives. Les catégories et demos sont filtrées côté catalogue existant; aucun parcours ne déclare la vidéo disponible quand elle ne l’est pas.

### Mise à jour locale — audit contraste
Date : 2026-10-12. Un vérificateur PowerShell sans dépendance calcule 21 paires de texte/surface opaque réellement utilisées. Toutes sont au moins 4,5:1; le badge a été associé à sa couleur de texte effective `#101918`, pas à un texte hypothétique. Les couleurs et décisions produit ne sont pas modifiées. Transparences et rendu réel restent hors de la mesure.
## Directive propriétaire — workflow visuel « image d’abord »
Date : 2026-10-12. Avant de coder ou d’adapter le rendu de chaque template, générer une image de référence idéale du site complet. Déposer la référence versionnée dans le projet et l’afficher par défaut comme image fixe tant qu’aucune vraie vidéo de démo n’existe; l’étiqueter comme référence visuelle, jamais comme vidéo ou démo publiée. Construire ensuite le template réel pour suivre la référence au pixel près, section par section et image par image; générer séparément les médias/icônes nécessaires, sauf si un système vectoriel du produit est explicitement plus adapté. Comparer des captures aux mêmes viewports et tenir compte des états responsive. Une référence statique ne satisfait pas le gate de vidéo/licences du catalogue et ne rend pas un template opérationnel. Le workflow s’applique aux 69 profils demandés localement; le cas scolaire en était le premier.

## Portée de travail confirmée — profils sectoriels
Date : 2026-10-12. Le propriétaire a explicitement demandé des templates pour tout secteur. Les 69 profils du registre `TEMPLATE_CATALOG.md` constituent la cible locale du chantier visuel/questionnaire. Cette instruction tranche le périmètre de réalisation locale, mais ne transforme pas les candidats en taxonomie métier approuvée, ne lève pas les garde-fous des domaines sensibles, et n’autorise ni transactions ni publication. Le suivi individuel référence/rendu/capture est `docs/IMAGE_REFERENCE_CATALOG.md`.

## Décision propriétaire — accueil en flux d’images
Date : 2026-10-12. L’accueil présente les références visuelles sectorielles une à une dans un flux vertical plein écran, avec défilement par écran. Il retire le header, les filtres et le footer précédents. Chaque image expose J’aime, commenter, partager et choisir pour personnaliser. Le like est un état local; les commentaires restent explicitement locaux tant que le backend social n’existe pas; le partage utilise l’API de partage ou le presse-papiers du navigateur. Les références restent identifiées comme images, jamais comme vidéos ou démos publiées. L’inspiration TikTok porte sur le geste de navigation et la disposition des actions, pas sur le branding ou les assets de TikTok.


## Lot immobilier et contrôle du feed — 2026-10-14
Le propriétaire a demandé de conserver l’accueil en flux d’images verticales, une référence par écran, sans l’ancien header/footer, avec les actions J’aime, commenter, partager et personnaliser. Cette séance n’ajoute ni filtre, ni vidéo, ni interaction sociale serveur. Le lot immobilier ajoute le profil candidat `real-estate` (référence image-first, rendu dédié, questionnaire 1.8.0); aucune nouvelle décision de publication, de prix, de données immobilières ou d’infrastructure n’est prise. Les opérations restent locales.

## Décision du propriétaire — priorité de la première version (2026-10-15)
La première version se concentre sur cinq modèles : inscription en ligne (`education`), boutique mono-produit (`single-product`), boutique multi-produits (`multi-product`), réservation en ligne (`service-booking`) et restaurant (`restaurant`). Cette décision fixe la priorité de livraison et remplace, pour la première version, la demande antérieure de réaliser immédiatement les 69 profils. Les 17 rendus brouillons et tous leurs fichiers restent conservés; les profils hors liste sont du travail de réserve, pas des engagements de lancement. La référence ONG créée le 2026-10-15 est conservée comme concept, sans rendu ni ajout au feed.
Cela ne valide ni les paiements, ni les moteurs métier, ni la publication ou la mise en production; les gates du maître V0.9 restent ouverts.


## Nouvelle direction propriétaire — édition directe
Date : 2026-10-15. Le propriétaire remplace le questionnaire comme parcours principal de personnalisation : l’utilisateur doit éditer le contenu directement dans l’aperçu du modèle. Le prototype active l’édition du texte, le remplacement des images et du logo et sauvegarde les brouillons dans ce navigateur. Les 17 modèles déjà réalisés restent visibles et conservés. Les questionnaires historiques ne sont plus présentés sur la page de modèle. L’ajout/suppression de sections, les liens, couleurs, undo/redo, stockage de compte et publication restent à construire; aucun aperçu n’est déclaré publié.

### Vérification locale de l’éditeur — 2026-10-15
La QA navigateur confirme sur les cinq modèles prioritaires le remplacement d’images/logo, la modification directe du texte, des champs, des destinations de liens, du texte alternatif et de la couleur, ainsi qu’Annuler/Rétablir pour les types de modification couverts et la structure. Une QA distincte couvre aussi les douze rendus conservés en réserve aux mêmes largeurs responsive. L’historique des sections utilise l’état du brouillon sauvegardé dans IndexedDB plutôt que le DOM après réconciliation React. Les sections ajoutées sont supprimables; les sections du modèle restent masquables et restaurables. Cette note consigne l’implémentation locale vérifiée; elle ne modifie pas les décisions ouvertes sur les comptes, la sauvegarde serveur, la publication, les prix ou les capacités métier.

### Complément — compte local et sauvegarde de brouillon — 2026-10-15
Le prototype dispose d’une sauvegarde de compte reliée uniquement aux émulateurs locaux Auth, Firestore et Storage. Un test navigateur de bout en bout a créé un compte fictif, modifié le texte et une image, enregistré le brouillon, actualisé la page et restauré explicitement ces deux modifications. Cette preuve valide le flux Emulator de démonstration seulement; elle n’autorise aucune connexion au Firebase partagé ni mise en production.

Le même parcours E2E vérifie maintenant l’effacement confirmé du brouillon et de ses fichiers référencés. Il laisse le projet et le membership du compte en place; aucune suppression complète du compte ou du tenant n’est validée.
