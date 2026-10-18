# Modèle de menaces initial
Préliminaire ; à actualiser après inventaire.

## Actifs et menaces
Données/fichiers tenants, sessions/admin, sites publiés, paiements/ledger/retraits et secrets. Menaces : client malveillant, compte compromis, accès inter-tenant, abus automatisé, webhook forgé/rejoué, dépendance compromise, cache/logs, upload malveillant.

## Scénarios critiques
IDOR/lecture croisée ; rôle admin falsifié ; retour navigateur pris pour paiement ; double crédit/retrait ; montant client altéré ; domaine associé au mauvais tenant ; cache privé partagé ; XSS/CSRF/SSRF/open redirect ; upload trompeur ; changement Firebase partagé impactant SmartCut ; secrets dans build/Git/logs.

## Contrôles et preuves attendus
Deny-by-default, auth/autorisation Functions, Emulator Suite, validation/limites, idempotence, signature vérifiée selon vrai contrat, ledger append-only, cache partitionné, Storage privé, secret scan, audit logs, sauvegarde restaurée en test. R1/R2 avant finance ou production.

## Signaux de règles existantes à vérifier
Dans le dépôt SmartCut consulté en lecture seule : les uploads de formulaires SST sont lisibles publiquement selon `storage.rules`; les écritures de branding de quatre familles n’exigent qu’une authentification et des contrôles fichier, sans appartenance tenant visible ; le fallback public récursif exige une liste d’exclusion explicite. Menaces associées : divulgation de pièces jointes, contenu remplacé par un autre compte connecté, et exposition future d’une nouvelle racine non exclue. Ce constat concerne la configuration versionnée, pas nécessairement la configuration active.
