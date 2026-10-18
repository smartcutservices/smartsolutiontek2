# Design system — prototype local

Statut : valeurs de prototype, pas charte de marque approuvée. Source : `apps/public-web/app/tokens.css` et `app/globals.css`.

## Tokens actuels

| Token | Valeur | Usage |
|---|---|---|
| Feed background | `#101918` | Fond des écrans de découverte |
| Feed surface | `#14211f` | Surfaces secondaires |
| Texte primaire | `#f6f7f4` | Titres et commandes sur fond sombre |
| Texte secondaire | `#b5bfba` | Paragraphes secondaires |
| Accent | `#d4e47c` | Focus, état actif, actions |
| Accent fort | `#4f9284` | Accent secondaire et badge de marque |
| Police interface | Arial / Helvetica | Contrôles et textes |
| Police affichage | Georgia | Titres du prototype |

## Accessibilité mesurée

Contraste calculé selon la formule WCAG pour les couleurs opaques des tokens : primaire/fond `16,63:1`, secondaire/fond `9,47:1`, accent/fond `12,93:1`, accent fort/fond `4,92:1`, texte sombre sur accent `10,66:1`, texte footer/fond `8,54:1`. Le texte du badge de marque utilise maintenant le texte sombre sur l’accent fort (`4,92:1`) au lieu du blanc (`3,38:1`). Les transparences superposées à la vidéo ne sont pas couvertes par ces ratios et nécessitent une revue réelle.

Les boutons de familles, la recherche et le contrôle de partage visent une hauteur minimale de 44 px. La région vidéo est focalisable avec un contour visible. Les préférences `prefers-reduced-motion` et économie de données sont suivies. Les légendes vidéo ont désormais une surface sombre semi-opaque (`rgba(16,25,24,.92)`) derrière le texte ; le contraste théorique du texte primaire sur ce panneau composité sur une image blanche est de 13,40:1 (calcul statique, pas une mesure navigateur). Le contrôle audio fait partie de la légende et ne chevauche plus son coin inférieur sur mobile. Une vérification clavier, lecteur d’écran, zoom 200 %, contraste sur les médias réels et captures viewport reste à exécuter dans les navigateurs cibles.

## Limites

Aucun Storybook, capture de référence ou test automatisé d’accessibilité n’est installé. Aucun choix typographique, nom de couleur ou logo n’est validé par le propriétaire.

## Cibles et lisibilite
Les boutons de familles, recherche, tri, liens de detail et partage ont une hauteur minimum de 44 px. Les libelles fonctionnels courants ont ete augmentes a 12 px ou plus. Badge de marque et petites metadonnees restent des elements secondaires ; verifier encore la lecture a 200 % dans un navigateur.

## Vérification reproductible des paires opaques
`tools/verify-contrast.ps1` calcule la luminance relative WCAG des couples foreground/background utilisés par le feed, le wizard et les cinq compositions d’aperçu. Exécution locale : `powershell -NoProfile -ExecutionPolicy Bypass -File tools\verify-contrast.ps1`. Le seuil est 4,5:1 pour ces textes normaux; les 21 paires observées passent. Les plus faibles sont le texte des cartes sur fond `#F8F8F2` (4,63:1), sur `#F7FAF6` (4,69:1) et le texte secondaire du mock sur `#E4E8DC` (4,85:1). Le badge utilise bien `#101918` sur `#4F9284` (4,92:1). Le script ne mesure pas les transparences, les bordures/focus, les vidéos réelles, le contraste de non-texte ni l’accessibilité complète au navigateur; aucun claim WCAG global n’en découle.
## Prototype favicon
`apps/public-web/app/icon.svg` uses the same four-square mark as the local header and prototype palette. This is a draft app icon, not an approved company logo; review or replace it before production branding is finalized.
## Références visuelles des templates
Le propriétaire impose un workflow image-first : générer la composition de référence avant le code, puis implémenter et comparer chaque section à des captures de référence. Les images fixes de référence servent d’aperçu par défaut en l’absence de vidéo; leur libellé doit préserver cette distinction et ne pas les faire passer pour des démos. Première référence locale : `apps/public-web/public/media/references/school-enrollment-reference-v1.png`.
