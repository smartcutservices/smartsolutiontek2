# Contrats API — registre P0.6
Date : 2026-10-11. Statut : aucun contrat externe approuvé, aucune transaction réelle en P0.

## Décision produit et distinction des flux
Le document maître prévoit deux flux qui ne doivent pas être confondus :

1. **Achat Smart Solutions Tech** : un propriétaire achète un template/plan avant de commencer la personnalisation. La grille de prix, la périodicité et le contrat d’encaissement restent à décider.
2. **Paiement d’un client final sur un site publié** : le paiement passe par l’API centralisée SmartCut Services avec confirmation serveur. SmartCut encaisse ; le montant dû au propriétaire doit être suivi dans un ledger et les retraits suivent des règles à valider.

Les APIs, références, identifiants et états de ces deux flux doivent rester séparés, avec idempotence et rapprochement propre à chaque flux.

## Ce qui est observé dans le code consulté
Dépôt SmartCut `smartcutservices/smartcutservices`, branche `main` :
- `functions/smartsolutiontek/payments.js`, SHA `93a2d5c5d629c858df50fb8d8b4f65fe119f4864`, contient les handlers internes `registerPaymentFunctions`, `createPaymentIntent` et `paymentWebhook`, et réutilise l’intégration MonCash du backend SmartCut.
- Le fichier ne définit pas à lui seul une API contractuelle externe SmartCut↔Smart Solutions Tech : base URL, authentification cliente, schéma public, callbacks et SLA restent absents de ce livrable.
- Le code existant inclut par ailleurs un minimum de versement de 500 HTG et un traitement manuel. Ce sont des comportements historiques ; ils ne deviennent pas des règles produit sans approbation.

Aucun secret, token, URL privée, donnée de transaction ou identifiant de payeur n’est recopié ici. Le code existant n’a pas été exécuté ; le statut de production/sandbox reste inconnu.

## Contrat requis avant implémentation financière
| Élément | Achat SST | Paiement client final | État |
|---|---|---|---|
| Produit marchand, compte bénéficiaire et relation contractuelle | À préciser | SmartCut centralisé selon le maître | Incomplet |
| Environnements et base URL | À fournir | À fournir | Inconnu |
| Authentification service-à-service, rotation/révocation | À fournir | À fournir | Inconnu |
| Identifiants de requête et clé d’idempotence | À définir | À définir | Inconnu |
| Montant, devise, frais, arrondis et durée de validité | Plans SST non fixés | Règles du marchand et frais non fixés | À décider |
| États et source de vérité | À fournir | À fournir ; confirmation serveur obligatoire | Inconnu / exigence validée |
| Webhook : signature, timestamp, retry, replay, ordre | À définir | À définir | Inconnu |
| Vérification de statut et délais d’expiration | À fournir | À fournir | Inconnu |
| Annulation, remboursement, contestation et erreurs | Politique produit à fixer | Contrat et délais à fournir | Inconnu |
| Settlement, ledger, rapprochement et retrait | Paiement plateforme à comptabiliser | SmartCut encaisse ; droits du propriétaire et règlement à valider | Bloquant juridique/financier |
| Limites, rate limits, indisponibilité et support incident | À fournir | À fournir | Inconnu |
| Sandbox et comptes fictifs | À fournir | À fournir | Aucun test autorisé/défini |

## Gate P0.6
Obtenir un contrat non secret et une sandbox ; confirmer l’autorisation juridique de recevoir/conserver des fonds tiers ; définir le ledger et le rapprochement ; rédiger les scénarios d’idempotence, callback dupliqué/en retard, échec, remboursement et retrait. Tant que ces éléments ne sont pas prouvés et approuvés : aucune transaction réelle, aucun endpoint simulé, aucune règle financière supposée.

## Contrats internes avant UI
TemplateManifest/capabilities, schéma questionnaire, preview/publication, entitlement, domain binding, PaymentIntent/Event, LedgerEntry, erreurs normalisées et permissions. Validation serveur et versionnement. Les types internes restent des propositions jusqu’à validation du contrat externe.

## Stub technique interne — fail closed, non deploye

`functions/src/contracts/smartcut-adapter.mjs` est un port serveur local sans appel reseau. Ses methodes `createPaymentIntent`, `verifyPaymentStatus` et `createRefund` sont des capacites internes proposees, pas des endpoints ni schemas SmartCut. Elles rejettent toutes avec `SMARTCUT_NOT_CONFIGURED`; aucune reponse de paiement confirme ou reussi n'existe. Aucun secret, base URL, payload externe, montant, devise ou protocole de signature n'est implemente.

Le stub ne remplace pas le contrat officiel, la sandbox ni la revue financiere/juridique. Le code ne doit pas etre branche a un parcours public avant verification du contrat, authentification serveur, idempotence, statut faisant autorite, callbacks, rapprochement, remboursements, regles de ledger et gate P6. Tests source : `functions/tests/smartcut-adapter.test.mjs`.
## Validation serveur du questionnaire — interne SST
Route locale : `POST /api/questionnaire/validate`.

Entrée JSON exacte : `sectorId`, `schemaId`, `schemaVersion`, `answers`. Le serveur ignore tout schéma fourni par le client et résout le schéma courant depuis le registre SST; il vérifie ensuite la version, les branches visibles, les types, les valeurs et les réponses devenues inapplicables. Corps limité à 64 KiB. Réponses : 200 valide, 400 requête incohérente, 404 secteur inconnu, 409 version de schéma dépassée, 413 corps trop volumineux, 415 type de contenu incorrect, 422 réponses invalides. Les réponses contiennent des IDs/codes d’erreur, jamais la copie des réponses envoyées.

La route ne persiste ni ne journalise les réponses et désactive le cache. Le wizard ne déclenche pas cet envoi automatiquement : l’écran de relecture décrit le transfert temporaire et ne l’envoie qu’après activation explicite du bouton par l’utilisateur. Ce n’est ni une API SmartCut ni une sauvegarde serveur; authentification, quota et protection contre les abus restent à définir avant tout usage public à plus grande échelle.Le champ `answers` est une map indexée par les IDs stables des questions (exemple : `organization-name`), et non par les clés de configuration de l’aperçu. Seules les réponses visibles sont envoyées par le bouton explicite de relecture.