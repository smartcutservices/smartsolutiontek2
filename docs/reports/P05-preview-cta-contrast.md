# P5: contrast du CTA d'aperçu

- Le CTA de l'aperçu choisit le texte sombre `#101918` ou blanc selon le meilleur ratio WCAG calculé pour la couleur de marque opaque.
- Le champ hexadecimal limite maintenant la saisie à `#RGB` ou `#RRGGBB`; les anciennes valeurs alpha-invalides retombent sur l'accent sûr par défaut dans l'aperçu.
- Deux tests source couvrent les choix clair/sombre et le seuil AA de 4,5:1 sur plusieurs couleurs.
- Les tests n'ont pas été exécutés : Node/npm ne sont pas disponibles dans cet environnement. L'affichage navigateur reste à contrôler.
