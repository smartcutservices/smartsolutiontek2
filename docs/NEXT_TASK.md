# Prochaine tranche — éditeur visuel direct

## Décisions du propriétaire — 2026-10-15
La première version priorise cinq modèles : inscription en ligne (`education`), boutique mono-produit, boutique multi-produits, réservation en ligne (`service-booking`) et restaurant. Les 17 rendus et fichiers déjà créés sont conservés et visibles dans le feed; aucune création n’est supprimée. La référence ONG reste conservée hors feed.

Le parcours de personnalisation change : l’utilisateur choisit un modèle, ouvre son aperçu et modifie directement textes, photos, logo, liens, couleurs, champs et sections. Le questionnaire peut rester facultatif pour configurer des données métier; il n’est plus le parcours principal.

## État courant
- Le feed local montre les 17 références intégrées, une à la fois; le modèle Éducation est en première position.
- Chaque page propose un éditeur direct prototype : textes, champs de formulaire, textes alternatifs et destinations de liens modifiables; images/logo remplaçables; couleur et sections éditables; sauvegarde locale. Annuler/rétablir couvre les textes, champs, textes alternatifs, liens, couleur, images et structure. Les sections créées peuvent être supprimées; celles du modèle peuvent être masquées ou restaurées.
- La QA navigateur des cinq modèles prioritaires et des 12 rendus de réserve passe à 320/390/768/1440 px, sans débordement; elle vérifie l’édition directe, Annuler/Rétablir, les médias, la structure et la persistance locale. Reprise actuelle : ESLint public-web, typecheck des trois workspaces, 143/143 tests et smoke test Auth local réussis. Build de production non vérifié.
- Les 17 rendus restent des brouillons; 52 profils sur 69 n’ont pas encore de rendu dédié. Aucun paiement ni déploiement n’a été effectué; le seul démarrage Firebase est l’émulateur local de démonstration, sans modification distante.
- L’application répond sur `http://localhost:3010`.

## Prochain lot
Approfondir l’édition dans le modèle : garantir la sélection intuitive de chaque texte, image, logo, lien, champ et section, puis vérifier la sauvegarde locale et l’annulation/rétablissement sur les cinq modèles prioritaires. Le questionnaire reste disponible comme capacité métier secondaire. Reprendre les fondations Auth/tenants après stabilisation du flux direct; aucun compte ni collection ne doit être créé sur `smartcutservices-9ce54` avant inventaire de lecture seule, environnement isolé et règles vérifiées.

Les aperçus restent locaux et non publiés. Le parcours Auth ne fonctionne qu’avec l’émulateur local; accès multi-tenant, Firestore, stockage serveur, moteurs métier, dashboards et gates P0–P12 restent à faire. Les preuves et limites P0 actuelles sont dans `docs/LOCAL_STATE_REVALIDATION_2026-10-15.md`. Voir également `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/TEMPLATE_CATALOG.md` et `docs/IMAGE_REFERENCE_CATALOG.md`.

## Reprise du 2026-10-15
La page modèle est maintenant un espace de travail centré sur son aperçu. Les règles Firestore locales protègent la création atomique d’un projet brouillon et de son appartenance minimale; huit tests emulator passent. Prochaine étape technique : créer un projet de test avec le compte local et relier le document de brouillon au canvas, en conservant les médias locaux tant que Storage Emulator et une règle d’upload tenant ne sont pas ajoutés. Ne jamais traiter ce flux local comme une sauvegarde cloud ou déployer les règles sur le projet SmartCut partagé.

## Reprise actualisée — 2026-10-15
Le canvas direct est maintenant relié à Auth, Firestore et Storage **des émulateurs locaux uniquement**. L’utilisateur peut enregistrer puis charger explicitement son brouillon de compte; les images remplacées vont dans son espace UID. Sans connexion, l’édition locale du navigateur continue. Le lot de règles fait 11/11, les tests du dépôt 143/143 et le typecheck des trois workspaces est réussi; QA navigateur déjà réussie sur les cinq profils prioritaires et les 12 rendus conservés.

### Suite immédiate
1. Ajouter un flux de suppression contrôlé pour le projet et son membership, avec nettoyage fiable des objets et cas d’échec/reprise; actuellement seuls le document brouillon et ses images configurées sont supprimés.
2. Faire une revue d’autorisation des règles/structures de données et ajouter App Check, quotas et protections d’abus avant tout endpoint hébergé.
3. Définir puis tester la validation réelle de signature, le traitement, la suppression des métadonnées EXIF et les variantes responsives d’image avec une Function locale idempotente.
4. Reprendre l’inventaire P0 Firebase dès qu’une session CLI authentifiée est disponible; inspecter sans mutation rules, Auth, Storage, Functions, IAM, régions, quotas et facturation. Également vérifier l’accès Vercel et le contrat SmartCut/sandbox sans demander de secrets dans la conversation.
5. Continuer les interactions d’édition des cinq modèles prioritaires et tenir le contrat d’édition par template à jour.

Le site de développement reste sur `http://localhost:3010`. La QA E2E de compte local est terminée avec `npm run qa:account-draft`; compte et données fictifs sont conservés uniquement dans l’Emulator local. Le prototype ne vaut pas persistance hébergée et aucune donnée distante n’a été créée. Le gate P0 (inventaires/règles Firebase, Vercel, contrat SmartCut, budget/domaines) reste ouvert.

## Reprise apres la demande d'edition directe - 2026-10-15
Le parcours principal est l'edition dans l'apercu du modele. Texte, champs, images/logo, liens, couleur et sections sont manipulables directement; le questionnaire n'est pas requis. Les cinq modeles prioritaires et les 12 rendus de reserve restent disponibles dans la galerie.

Les regles Storage de quarantaine refusent les remplacements via `resource == null`. Les tests utilisent un UUID dans chaque chemin d'upload afin que les executions successives ne se heurtent pas a un objet residuel. Resultat Emulator actuel : 4/4 tests Storage passent; les triggers Functions sont reactives. Le site repond sur `http://localhost:3010`.

### Prochaine tranche locale
1. Terminer la suppression et la reprise apres echec pour projet, membership et medias, avec tests d'acces inter-tenant.
2. Completer le traitement d'image local : validation du contenu reel, suppression EXIF, generation des variantes, idempotence et nettoyage des fichiers rejetes.
3. Garder la configuration distante bloquee a l'inventaire en lecture seule : Firebase CLI non authentifiee, Vercel sans projet initialise, contrat SmartCut et budgets/domaines a recuperer depuis les sources disponibles.
4. Continuer les gates P0-P12 du prompt maitre sans publier ni modifier Firebase partage tant que l'inventaire et les controles de securite ne sont pas etablis.
## Avancee - suppression complete et pipeline media - 2026-10-16
La suppression du projet et de son membership est maintenant realisee par une Callable limitee au projet Emulator `demo-smartsolutiontek`. L'E2E `npm run qa:account-draft` verifie le cycle complet, y compris traitement/restauration des images et suppression des objets et sous-collections. L'ancien point 1 de la liste de travaux est donc ferme pour le parcours de demonstration local.

Le trigger Storage ignore les variantes images qu'il a generees; tests specifiques ajoutes. Suite actuelle : 152/152 tests, regles 12/12, typecheck des trois workspaces et lint cible passes.

Prochaine tranche : revue de securite de toutes les regles et structures de donnees, App Check, quotas/anti-abus avant tout endpoint heberge; puis suppression/export du compte utilisateur et politiques de retention. Aucun service distant n'est configure ou deploye.
## Reprise - sauvegarde cloud sans tentative d'ecriture interdite - 2026-10-16
La creation du projet, de son membership proprietaire et du premier brouillon reste atomique. Pour un projet existant, l'editeur ne tente plus de reecrire projet/membership; il met a jour la revision du brouillon par transaction. L'E2E teste maintenant sauvegarde initiale, sauvegarde repetee, restauration et suppression complete.

Verifications actuelles : 152/152 tests Node, 12/12 regles Emulator (dernier passage), typecheck des trois applications, lint cible sur l'editeur et client Firebase, E2E Chrome passe. Suite a poursuivre : audit des valeurs de configuration et des autorisations tenant; concevoir App Check/quotas pour un futur environnement heberge; export/suppression de compte et retention. Rien n'est publie.
## Avancee de securite Firestore - 2026-10-16
Le brouillon `drafts/{projectId}` est maintenant l'unique document de personnalisation d'un projet. Les rules interdisent les IDs supplementaires et le listing, tout en conservant lecture directe et sauvegarde versionnee. La QA Emulator passe a 8 Firestore + 4 Storage; l'E2E navigateur passe avec sauvegardes initiale/repetee et cleanup.

A poursuivre : validation plus stricte des champs nested, limitation de debit et App Check avant exposition d'API, suppression/export de compte Auth et retention, puis inventaire P0 des services distants. Le modele local n'est pas deploye.
## Derniere tranche - bornes de configuration Firestore - 2026-10-16
Les regles bornent les maps utilisateur et le format de couleur et interdisent toujours listing/IDs de brouillon paralleles. Le navigateur passe avec la configuration courante, y compris une image traitee, deux sauvegardes, restore et cleanup.

Preuves : regles Emulator 13/13 combine, `node --test` 152/152, E2E Chrome passe, typecheck trois workspaces et lint cible passent. Next P2 : schema profond des valeurs, limite de debit/App Check, export/suppression de compte et retention; P0 distant reste ouvert.
## Gate builds Next - 2026-10-16
Les trois builds de production locaux sont passes : public-web (78 routes), admin-web et sites-runtime (2 routes chacun). Le catalogue publie reste volontairement vide; admin et runtime sont encore des shells. Les deux routes de preview locales restent 200 apres build.

Poursuivre avec les moteurs/sites runtime et le panneau admin selon le prompt maitre, ainsi que la revue P2 (valeurs de configuration, quotas/App Check, suppression/export Auth). P0 Firebase/Vercel/SmartCut reste a inventorier avant tout deploy.
## Decision produit - edition directe de tout le contenu - 2026-10-16
- Le client ouvre le modele visuel et choisit « Editer le modele »; il modifie le contenu directement dans l'apercu. Aucun questionnaire ne bloque l'ouverture, l'edition ou la sauvegarde. Le questionnaire peut rester une aide facultative pour les clients qui en ont besoin.
- Le contrat de contenu editable comprend les textes, titres, boutons, liens/destinations, images, logo, textes alternatifs, champs et valeurs initiales, couleurs, ordre/visibilite des sections et ajout/suppression de sections. L'editeur doit continuer a fonctionner dans la vue du modele, sur telephone et ordinateur, avec annulation/retablissement et sauvegarde.
- Capacites deja presentes dans le prototype local : bouton d'edition dans chaque preview, selection directe de texte/image/logo/lien/champ/section, remplacement d'image par televersement, structure/couleur, sauvegarde navigateur et sauvegarde explicite dans l'Emulator apres connexion. Les questions de personnalisation existent encore dans le code mais ne sont pas branchees comme etape obligatoire de ce parcours.
- Limite a rendre visible : la sauvegarde Auth/Firestore/Storage n'est qu'une demonstration locale Emulator. Il faut encore valider chaque type de contenu des cinq modeles prioritaires, les interactions mobile/desktop, et la persistance avant d'annoncer un editeur complet. Les traitements metier (paiement, commandes, rendez-vous, inscriptions) ne sont pas configures par le simple changement visuel.

## Derniere avancee P2 - suppression de compte
`deleteDemoAccount` est ajoutee uniquement pour `demo-smartsolutiontek`. Le panneau compte exige une reauthentification mot de passe et la saisie de `SUPPRIMER MON COMPTE`. Tous les projets du tenant sont verifies avant l'effacement; Storage puis Firestore precede Auth. Preuves : tests unitaires helper, 12 tests Functions, 155 tests Node, typecheck public-web, ESLint cible, E2E compte/brouillon et absence Auth apres suppression. Les donnees sont restees dans Firebase Emulator local.

### Suite
1. Concevoir et tester un export de donnees complet qui conserve les fichiers media et evite les limites de taille des Callable.
2. Tester le nettoyage account callable avec au moins un projet et des fichiers encore presents; ne pas prendre le succes de l'E2E courant comme preuve de ce cas (il nettoie le projet avant l'effacement du compte).
3. Definir retention, App Check/quotas et schema profond des valeurs avant exposition hebergee.
4. Poursuivre toutes les phases du prompt maitre; les inventaires P0 et les gates Vercel/Firebase/SmartCut restent ouverts.

### Verification renforcee - suppression Auth complete
L'E2E inclut un projet et ses objets media encore presents lors de la suppression du compte. Il confirme le 404 du projet Firestore, le prefix Storage vide pour cet UID et le rejet d'une nouvelle connexion avec les anciens identifiants. La suppression d'un projet individuel est aussi exercee dans le meme parcours. Export/portabilite et retention restent prioritaires a poursuivre.
