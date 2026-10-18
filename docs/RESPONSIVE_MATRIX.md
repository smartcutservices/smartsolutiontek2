# Matrice responsive — critères
À exécuter pour chaque application/template.

| Viewports indicatifs | Contrôles |
|---|---|
| 320, 360, 375, 390, 430 px | pas de débordement, clavier mobile, cibles tactiles, feed/wizard |
| 600, 768 px | composition, tableaux/listes, portrait/paysage |
| 1024, 1280, 1440 px | feed vertical centré, dashboard, clavier |
| 1920, 2560 px | largeur de contenu contrôlée, médias non étirés |

Ajouter hauteurs courtes, zoom 200 %, grandes polices, safe area, clavier ouvert, iOS/Android, réseau lent, tactile/souris/clavier, focus, lecteur d’écran et reduced motion. Mesures indicatives, pas breakpoints.

## État actuel — shell public local
- Le shell vidéo-first existe dans `apps/public-web`; la matrice n’a pas encore été vérifiée dans un navigateur.
- Les écrans plein viewport utilisent `svh` avec un repli `vh` lorsque cette unité n’est pas prise en charge. Tester aussi les écrans courts, où les composants vidéo doivent rester utilisables.
- Les autres applications et templates n’existent pas encore ; ne pas marquer ces viewports comme validés.

## Vérification safe area — 2026-10-11
- Le shell public ajoute maintenant les insets `env(safe-area-inset-*)` aux commandes proches des bords sur grands et petits écrans.
- Les insets sont combinés avec les espacements minimaux existants ; en l’absence de zone sûre, les valeurs précédentes restent la base.
- Statut : implémentation CSS inspectée statiquement. Le viewport mobile avec encoche, iOS/Android et le clavier virtuel ne sont pas encore validés en navigateur. La prise en charge de `viewport-fit=cover` par le layout Next n’a pas été établie ; aucun paramètre de viewport non documenté n’a été ajouté.

## Feed vide sur téléphone court
À 320–640 px de largeur et jusqu’à 640 px de hauteur, l’illustration décorative du feed vide est masquée et les espacements sont réduits afin de garder les contrôles et l’appel vers les profils visibles. À vérifier par captures navigateur à 320×568 et 360×640, zoom 200 % et navigation clavier; non exécuté.