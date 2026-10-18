const sectorGuidance = {
  ticketing: "Pour cette billetterie, pensez aux billets, aux catégories d’accès et aux réservations de places.",
  events: "Pour cet événement, pensez aux frais d’inscription, aux billets éventuels et aux réservations de places.",
  fundraising: "Pour cette campagne, tout don ou contribution dépend d’une validation juridique et du contrat de paiement; rien n’est activé ici.",
  nonprofits: "Pour cette association, précisez si vous envisagez une cotisation, un don ou une activité payante; aucun encaissement n’est activé.",
  "private-clubs": "Pour ce club, précisez si vous envisagez des cotisations ou des activités payantes; aucun encaissement n’est activé.",
  "digital-products": "Pour ce produit numérique, un parcours payant exigerait une livraison de fichier ou licence sécurisée; elle n’est pas connectée.",
  publishing: "Pour ce catalogue éditorial, un achat devrait distinguer les éditions imprimées et numériques; aucune vente n’est connectée.",
  saas: "Pour ce logiciel, distinguez un abonnement à votre service des paiements que votre propre site recevrait; aucun abonnement n’est activé.",
  media: "Pour ces contenus, précise si tu envisages un abonnement ou un accès payant; aucun accès payant n’est activé.",
  health: "Ce profil reste une vitrine générale; aucune donnée clinique ni opération de paiement n’est activée.",
  "medical-centers": "Ce profil reste limité aux informations générales et aux rendez-vous; aucune donnée médicale ni opération de paiement n’est activée.",
  pharmacies: "Ce profil est informatif; aucune vente de médicament, commande réglementée ni opération de paiement n’est activée.",
};

const guidanceByFlow = {
  order: "Pour ce profil, pensez aux commandes, aux options et aux modalités de retrait ou de livraison.",
  booking: "Pour ce profil, pensez aux réservations, aux acomptes éventuels et aux conditions d’annulation.",
  application: "Pour ce profil, pensez aux frais d’inscription éventuels et aux étapes de candidature.",
  content: "Pour ce profil, pensez aux accès ou contenus qui pourraient être payants; rien n’est activé ici.",
  contact: "Pour ce profil, précisez si vous envisagez de facturer un service ou un devis accepté.",
};

/** Sector copy only; selecting a branch never activates a payment provider. */
export function customerPaymentGuidanceFor(sector) {
  if (typeof sector?.id === "string" && Object.hasOwn(sectorGuidance, sector.id)) return sectorGuidance[sector.id];
  if (typeof sector?.flow === "string" && Object.hasOwn(guidanceByFlow, sector.flow)) return guidanceByFlow[sector.flow];
  return "Aucun paiement n’est activé dans cet aperçu.";
}
