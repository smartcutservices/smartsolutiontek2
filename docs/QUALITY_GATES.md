# Gates qualité
Une phase passe sur preuves et approbation requise.

## Gate P0
- [ ] Inventaire local/externe avec preuves ou limites.
- [ ] Décisions validées distinctes des recommandations/inconnues.
- [ ] Architecture, environnements, coûts, domaines et flux documentés.
- [ ] Contrat SmartCut et risque Firebase partagé évalués sans secrets.
- [ ] PoC routage tenant/domain en environnement non-prod.
- [ ] Risques critiques acceptés.
État actuel : non satisfait ; audits externes/PoC non faits.

## Gate commun
- [ ] Périmètre/branche cohérents, aucun changement non approuvé.
- [ ] Lint, types, build/tests pertinents exécutés et résultats joints.
- [ ] Responsive, clavier, accessibilité, états UI.
- [ ] Permissions et absence fuite inter-tenant vérifiées.
- [ ] Entrées, fichiers, secrets, logs, cache revus.
- [ ] SEO/performance mesurés si pertinents ; coûts examinés.
- [ ] Docs, décisions, risques, changelog, rollback à jour.
- [ ] Approbation humaine ; pas de prod implicite.

## Gates spécialisés
Finance : contrat, sandbox, idempotence, doublons/retards, ledger, rapprochement, concurrence, revue légale. Runtime : domaines, isolation, canonical/robots, publication atomique, rollback. Template : manifest, preview réelle, droits médias, responsive, tests métier, pas de données fictives.

## Go-live
E2E/charge/sécurité, restauration testée, monitoring dépenses/erreurs, incident/runbook, exigences légales/support, bêta/rollback et décision explicite go/no-go.
