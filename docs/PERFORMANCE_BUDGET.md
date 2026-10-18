# Budget performance — à établir
Aucun seuil mesuré/contrat disponibilité établi ; aucune recommandation n’est un budget validé.

Mesurer Web Vitals, poids JS par route, délai première vidéo, taille/bitrate vidéo, préchargements, images/LCP/CLS, FPS/long tasks/mémoire WebGL, latence Functions, lectures/écritures Firestore, Storage/egress et coût par environnement.

Principes : vidéo courante + preload limité, poster rapide, assets optimisés, WebP éligible, 3D/GSAP différés, reduced motion/fallback, pagination/agrégation Firestore, jamais cacher public une réponse privée.

À décider : budgets Firebase/Vercel, appareils/réseaux cibles, codec/poids vidéo, limites bundle, mesure terrain, alertes de dépenses et disponibilité cible. Fixer seuils après mesures staging.
