import type { QuestionnaireRule, QuestionnaireSchema, QuestionnaireType } from "../questionnaire/schema.mjs";
import type { Sector } from "./registry";
import { customerPaymentGuidanceFor } from "./customer-payment-guidance.mjs";
import { getSectorSectionLabels } from "./section-labels.mjs";

type Option = { id: string; label: string };
type SectorQuestions = { prompt: string; choices: string[]; followUp: string };
const sectorQuestions: Record<string, SectorQuestions> = {
  "education": { prompt: "Quel parcours scolaire voulez-vous présenter ?", choices: ["Admission et inscription", "Programmes et niveaux", "Vie scolaire"], followUp: "Quelles pièces et étapes d’admission faut-il expliquer ?" },
  "training": { prompt: "Quel format de formation proposez-vous ?", choices: ["Cours en présentiel", "Formation en ligne", "Atelier ou session courte"], followUp: "Quels prérequis, horaires et objectifs faut-il préciser ?" },
  "single-product": { prompt: "Quel type de produit sera mis en avant ?", choices: ["Produit physique", "Produit fabriqué sur commande", "Offre ou service unique"], followUp: "Quelles caractéristiques, variantes et modalités de commande montrer ?" },
  "multi-product": { prompt: "Comment votre catalogue est-il organisé ?", choices: ["Par catégories", "Par collections", "Par usages ou besoins"], followUp: "Quelles catégories et options aideront les clients à choisir ?" },
  "restaurant": { prompt: "Quel service de restauration faut-il présenter ?", choices: ["Sur place", "À emporter", "Livraison"], followUp: "Quels menus, horaires et choix alimentaires faut-il afficher ?" },
  "catering": { prompt: "Quelles commandes préparez-vous ?", choices: ["Gâteaux et pâtisseries", "Repas et buffets", "Menus pour événements"], followUp: "Quels délais, portions et détails de personnalisation demander ?" },
  "service-booking": { prompt: "Quel type de rendez-vous proposez-vous ?", choices: ["En personne", "À distance", "À domicile"], followUp: "Quelle durée, zone ou disponibilité faut-il préciser ?" },
  "beauty": { prompt: "Quelles prestations du salon faut-il mettre en avant ?", choices: ["Coiffure", "Soins et beauté", "Spa et bien-être"], followUp: "Quelles durées, options ou consignes avant rendez-vous afficher ?" },
  "portfolio": { prompt: "Quel travail doit dominer le portfolio ?", choices: ["Design et création", "Photographie et vidéo", "Projets et réalisations"], followUp: "Quels projets, médias et crédits souhaitez-vous présenter ?" },
  "agency": { prompt: "Quel service de votre agence est prioritaire ?", choices: ["Conseil", "Création et marketing", "Développement et technologie"], followUp: "Quels livrables, secteurs servis et étapes du devis présenter ?" },
  "craftspeople": { prompt: "Quel métier artisanal présentez-vous ?", choices: ["Fabrication", "Réparation", "Installation ou rénovation"], followUp: "Quelles réalisations, zones et informations sont utiles pour le devis ?" },
  "events": { prompt: "Quel type d’événement organisez-vous ?", choices: ["Conférence ou atelier", "Célébration", "Rencontre communautaire"], followUp: "Quelles date, adresse, capacité et modalités d’inscription afficher ?" },
  "ticketing": { prompt: "Quel type de billet proposez-vous ?", choices: ["Entrée générale", "Places ou catégories", "Pass ou forfait"], followUp: "Quelles dates, catégories, capacités et conditions d’accès faut-il préciser ? Les tarifs et paiements restent inactifs tant qu’ils ne sont pas validés." },
  "real-estate": { prompt: "Quel bien immobilier souhaitez-vous présenter ?", choices: ["Maison ou appartement", "Terrain", "Local commercial"], followUp: "Quels critères de visite et caractéristiques publiques du bien afficher ?" },
  "hospitality": { prompt: "Quel hébergement proposez-vous ?", choices: ["Chambre", "Appartement ou maison", "Séjour de groupe"], followUp: "Quelles capacités, dates et règles de séjour faut-il préciser ?" },
  "tourism": { prompt: "Quel type d’expérience proposez-vous ?", choices: ["Excursion guidée", "Circuit", "Activité ou expérience"], followUp: "Quelle durée, langue, lieu de départ et équipement prévoir ?" },
  "vehicles": { prompt: "Quel véhicule ou service automobile présentez-vous ?", choices: ["Véhicules à vendre", "Location", "Entretien ou essai"], followUp: "Quelles caractéristiques et informations publiques faut-il afficher ?" },
  "nonprofits": { prompt: "Quelle action de votre association voulez-vous développer ?", choices: ["Adhésion", "Activités et programmes", "Bénévolat"], followUp: "Quelles conditions d’adhésion ou façons de participer expliquer ?" },
  "fundraising": { prompt: "Quel type de campagne présentez-vous ?", choices: ["Projet communautaire", "Action associative", "Campagne d’information"], followUp: "Quelles informations publiques, responsables et preuves de transparence montrer ?" },
  "recruitment": { prompt: "Quel parcours de recrutement souhaitez-vous publier ?", choices: ["Offres d’emploi", "Candidatures spontanées", "Stages"], followUp: "Quels critères, étapes et documents non sensibles demander ?" },
  "health": { prompt: "Quel service professionnel de santé faut-il présenter ?", choices: ["Consultation", "Prévention et information", "Services du cabinet"], followUp: "Quelles spécialités, horaires et consignes de prise de contact afficher ? N’incluez aucune donnée clinique." },
  "fitness": { prompt: "Quelle activité sportive proposez-vous ?", choices: ["Cours collectifs", "Coaching", "Club ou salle"], followUp: "Quels niveaux, horaires, équipements et modalités d’inscription présenter ?" },
  "rentals": { prompt: "Quel type de location immobilière proposez-vous ?", choices: ["Logement", "Espace professionnel", "Location saisonnière"], followUp: "Quels critères publics, disponibilités et étapes de demande préciser ?" },
  "home-services": { prompt: "Quel service à domicile proposez-vous ?", choices: ["Installation", "Entretien", "Dépannage"], followUp: "Quelle zone, quels créneaux et quelles informations facilitent l’intervention ?" },
  "delivery": { prompt: "Quel service logistique faut-il présenter ?", choices: ["Livraison locale", "Transport de marchandises", "Collecte et expédition"], followUp: "Quelles zones, dimensions et étapes de demande de devis préciser ?" },
  "photography": { prompt: "Quel type de séance photo ou vidéo proposez-vous ?", choices: ["Portrait", "Événement", "Produit ou entreprise"], followUp: "Quels lieux, durées et livrables souhaitez-vous décrire ?" },
  "entertainment": { prompt: "Quel contenu artistique faut-il mettre en avant ?", choices: ["Musique", "Spectacles", "Actualités et médias"], followUp: "Quels médias, dates et liens officiels ajouter ?" },
  "publishing": { prompt: "Quel type de publication proposez-vous ?", choices: ["Livres imprimés", "Livres numériques", "Magazine ou périodique"], followUp: "Quelles catégories, formats et informations éditoriales afficher ?" },
  "digital-products": { prompt: "Quel produit numérique proposez-vous ?", choices: ["Livre ou guide", "Fichier ou ressource", "Licence logicielle"], followUp: "Quelles compatibilités, conditions d’accès et modalités de livraison décrire ?" },
  "repair": { prompt: "Quel équipement réparez-vous ?", choices: ["Téléphones et ordinateurs", "Électroménager", "Véhicules ou équipements"], followUp: "Quelles marques, zones et étapes de diagnostic non sensible préciser ?" },
  "agriculture": { prompt: "Quels produits agricoles proposez-vous ?", choices: ["Produits frais", "Produits transformés", "Plants et intrants autorisés"], followUp: "Quelles saisons, unités, zones de retrait et modalités de commande indiquer ?" },
  "legal-advice": { prompt: "Quel domaine de conseil juridique présentez-vous ?", choices: ["Droit des affaires", "Droit de la famille", "Conseil et médiation"], followUp: "Quelles spécialités, disponibilités et limites du service expliquer ? N’indiquez aucun dossier client." },
  "finance": { prompt: "Quel service financier général souhaitez-vous présenter ?", choices: ["Éducation financière", "Conseil général", "Services aux entreprises"], followUp: "Quelles informations publiques et coordonnées afficher ? Ne demandez aucune donnée financière personnelle." },
  "faith": { prompt: "Quelle activité de votre communauté faut-il mettre en avant ?", choices: ["Rencontres et horaires", "Événements", "Programmes communautaires"], followUp: "Quelles dates, consignes d’accueil et informations pratiques publier ?" },
  "weddings": { prompt: "Quel service de cérémonie proposez-vous ?", choices: ["Organisation", "Lieu de réception", "Prestations et décoration"], followUp: "Quelles dates, capacité, options et informations de devis demander ?" },
  "childcare": { prompt: "Quel service d’accueil de l’enfance proposez-vous ?", choices: ["Garderie", "Activités éducatives", "Accueil périscolaire"], followUp: "Quels âges, horaires et étapes d’inscription expliquer ? Évitez les données sensibles des enfants." },
  "pets": { prompt: "Quel service pour animaux proposez-vous ?", choices: ["Consultation vétérinaire", "Toilettage", "Garde et promenade"], followUp: "Quelles espèces, horaires et consignes de prise de rendez-vous afficher ?" },
  "construction": { prompt: "Quel type de projet de construction réalisez-vous ?", choices: ["Construction", "Rénovation", "Architecture et plans"], followUp: "Quelles zones, étapes et informations non confidentielles sont nécessaires au devis ?" },
  "saas": { prompt: "Quel besoin votre logiciel aide-t-il à résoudre ?", choices: ["Gestion et productivité", "Vente et relation client", "Outils métier"], followUp: "Quelles fonctionnalités, intégrations et étapes de démonstration montrer ?" },
  "personal-page": { prompt: "Quel objectif sert votre page personnelle ?", choices: ["Présenter mon parcours", "Trouver des missions", "Partager mes créations"], followUp: "Quelles expériences, compétences et réalisations publiques mettre en avant ?" },
  "media": { prompt: "Quel format éditorial publiez-vous ?", choices: ["Articles", "Podcast ou audio", "Magazine et actualités"], followUp: "Quelles rubriques, fréquence et informations d’abonnement afficher ?" },
  "private-clubs": { prompt: "Quel type de communauté animez-vous ?", choices: ["Club professionnel", "Club de loisirs", "Communauté thématique"], followUp: "Quelles conditions d’adhésion et activités faut-il expliquer ?" },
  "exams": { prompt: "Quel concours ou examen organisez-vous ?", choices: ["Concours d’admission", "Examen ou certification", "Évaluation professionnelle"], followUp: "Quelles étapes, dates et pièces non sensibles sont requises ?" },
  "surveys": { prompt: "Quel type de formulaire souhaitez-vous publier ?", choices: ["Inscription", "Sondage", "Demande d’information"], followUp: "Quelles questions sont indispensables et combien de temps prend la réponse ?" },
  "qr-menu": { prompt: "Quel catalogue consultable par QR code créez-vous ?", choices: ["Menu de restaurant", "Catalogue de produits", "Liste de services"], followUp: "Quelles catégories, descriptions et informations de mise à jour afficher ?" },
  "wholesale": { prompt: "À quels acheteurs professionnels vous adressez-vous ?", choices: ["Détaillants", "Entreprises", "Distributeurs"], followUp: "Quels volumes indicatifs, références et éléments de devis présenter ?" },
  "fashion": { prompt: "Quelle collection de mode présentez-vous ?", choices: ["Vêtements", "Accessoires", "Collection artisanale"], followUp: "Quelles tailles, couleurs et informations de disponibilité montrer ?" },
  "artisans": { prompt: "Quelle création artisanale proposez-vous ?", choices: ["Pièces uniques", "Créations personnalisées", "Petites séries"], followUp: "Quelles options de personnalisation, délais et matériaux présenter ?" },
  "cleaning": { prompt: "Quel type de nettoyage proposez-vous ?", choices: ["Domicile", "Bureaux et locaux", "Nettoyage spécialisé"], followUp: "Quelle surface, fréquence et zone faut-il connaître pour préparer un devis ?" },
  "equipment-rental": { prompt: "Quel équipement mettez-vous en location ?", choices: ["Équipement événementiel", "Outils et matériel", "Équipement professionnel"], followUp: "Quelles durées, disponibilités, conditions de retrait et accessoires préciser ?" },
  "institutions": { prompt: "Quel service ou programme institutionnel faut-il présenter ?", choices: ["Services aux citoyens", "Programmes et actualités", "Informations et démarches"], followUp: "Quels publics, horaires, lieux et documents officiels doivent être accessibles ?" },
  "industry-b2b": { prompt: "Quelle offre industrielle présentez-vous ?", choices: ["Fabrication", "Fourniture de matériaux", "Équipement professionnel"], followUp: "Quelles références, spécifications publiques et informations de demande de devis montrer ?" },
  "funeral-services": { prompt: "Quel accompagnement souhaitez-vous présenter ?", choices: ["Organisation de cérémonies", "Services et démarches", "Informations pratiques"], followUp: "Quelles coordonnées et informations pratiques peuvent aider les familles, sans recueillir de détails sensibles ?" },
  "security": { prompt: "Quel service de sécurité proposez-vous ?", choices: ["Conseil et prévention", "Installation et maintenance", "Gardiennage et surveillance"], followUp: "Quelles zones et prestations pouvez-vous présenter sans publier de détails opérationnels sensibles ?" },
  "energy-environment": { prompt: "Quel type de projet énergie ou environnement proposez-vous ?", choices: ["Énergie solaire", "Équipements et efficacité énergétique", "Recyclage et initiatives environnementales"], followUp: "Quelles zones, solutions et étapes d’évaluation faut-il expliquer ?" },
  "public-services": { prompt: "Quelle démarche ou information publique voulez-vous rendre accessible ?", choices: ["Prise de rendez-vous", "Information sur une démarche", "Demande ou inscription autorisée"], followUp: "Quelles étapes, conditions, pièces non sensibles et coordonnées officielles faut-il publier ?" },
  "universities": { prompt: "Quels programmes ou parcours d’admission faut-il présenter ?", choices: ["Programmes de premier cycle", "Programmes avancés", "Services aux étudiants"], followUp: "Quelles conditions, échéances et étapes d’admission non sensibles faut-il expliquer ?" },
  "cafes-snacks": { prompt: "Quel service votre café ou snack veut-il mettre en avant ?", choices: ["Service au comptoir", "Commande à emporter", "Menu et horaires"], followUp: "Quelles catégories du menu, options et heures de disponibilité faut-il afficher ?" },
  "medical-centers": { prompt: "Quel service général du centre faut-il présenter ?", choices: ["Présentation des services", "Horaires et accès", "Demande de rendez-vous"], followUp: "Quelles coordonnées et consignes de rendez-vous publier ? Ne recueillez aucune information médicale." },
  "pharmacies": { prompt: "Quelles informations publiques autorisées faut-il présenter ?", choices: ["Horaires et accès", "Services généraux", "Coordonnées et consignes"], followUp: "Quelles informations approuvées par la pharmacie peuvent être publiées ? Aucune commande de médicament n’est activée." },
  "jewelry-luxury": { prompt: "Quel aspect du showroom faut-il mettre en valeur ?", choices: ["Collections", "Pièces personnalisées", "Services et entretien"], followUp: "Quelles matières, options ou modalités de demande peuvent être décrites publiquement ?" },
  "electronics": { prompt: "Quel besoin lié aux produits électroniques faut-il couvrir ?", choices: ["Catalogue informatif", "Conseil avant achat", "Réparation et assistance"], followUp: "Quelles catégories, compatibilités et conditions de prise en charge faut-il expliquer ?" },
  "arts-education": { prompt: "Quel atelier ou cours artistique proposez-vous ?", choices: ["Arts visuels", "Musique et scène", "Ateliers créatifs"], followUp: "Quels niveaux, âges visés, horaires et matériel nécessaire faut-il indiquer ?" },
  "printing-personalization": { prompt: "Quel type d’impression ou de personnalisation proposez-vous ?", choices: ["Impression de documents", "Objets personnalisés", "Signalétique et supports"], followUp: "Quels formats, fichiers attendus, quantités et délais indicatifs faut-il expliquer ?" },
  "freelancers": { prompt: "Quel service indépendant voulez-vous présenter ?", choices: ["Conseil", "Création et production", "Missions ponctuelles"], followUp: "Quels livrables, domaines d’intervention et étapes de devis faut-il décrire ?" },
  "support-assistance": { prompt: "Quel type d’aide les visiteurs doivent-ils trouver ?", choices: ["Questions fréquentes", "Aide sur un service", "Demande de support"], followUp: "Quelles informations non sensibles permettront d’orienter une demande ? Le traitement de tickets n’est pas connecté." },
  "classifieds": { prompt: "Quel type d’annonces souhaitez-vous présenter ?", choices: ["Biens et objets", "Services locaux", "Offres et opportunités"], followUp: "Quelles règles de publication et informations publiques faut-il afficher ? La modération et la publication d’annonces ne sont pas activées." },
  "groceries-markets": { prompt: "Quels produits ou rayons de votre épicerie faut-il présenter ?", choices: ["Produits frais", "Épicerie et essentiels", "Marché de producteurs"], followUp: "Quelles disponibilités, unités et modalités de retrait faut-il expliquer ? Les commandes ne sont pas traitées dans cet aperçu." },
  "local-businesses": { prompt: "Quelle activité locale votre entreprise veut-elle présenter ?", choices: ["Services de proximité", "Commerce local", "Entreprise familiale"], followUp: "Quels horaires, lieux desservis et moyens de contact aideront les clients à vous trouver ?" },
};

const optionList = (labels: string[]): Option[] => labels.map((label, index) => ({ id: `choice-${index + 1}`, label }));
const answerTargets: Record<string, string> = {
  "project-goal": "project-goal", "campaign-context": "campaign-context", "redesign-focus": "redesign-focus",
  "organization-name": "site-name", audience: "target-audience", offer: "hero-copy", "primary-action": "primary-cta",
  "sector-choice": "industry-focus", "sector-choice-detail": "sector-details", "sector-other-detail": "sector-other-details",
  "action-detail": "action-details", "has-existing-site": "reuse-existing", "existing-site": "existing-site-url",
  "visual-style": "visual-style", "brand-color": "brand-color", "contact-method": "contact-channel",
  email: "contact-email", phone: "contact-phone", timeline: "launch-timeline", notes: "internal-notes",
  "included-sections": "included-sections",
  "accept-customer-payments": "accept-customer-payments", "customer-payment-uses": "customer-payment-uses",
};
const question = (id: string, type: QuestionnaireType, label: string, help?: string, options?: Option[], visibilityRules?: QuestionnaireRule[], required = true) => {
  const maxLength = type === "shortText" ? 120 : type === "email" ? 254 : type === "phone" ? 30 : type === "longText" ? 2000 : undefined;
  const answerMapping = answerTargets[id];
  return { id, version: "1.0.0", type, label, ...(help ? { help } : {}), required, ...(maxLength ? { validation: { maxLength } } : {}), ...(options ? { options } : {}), ...(visibilityRules ? { visibilityRules, dependencies: visibilityRules.map((rule) => rule.questionId) } : {}), ...(answerMapping ? { answerMapping: { targetKey: answerMapping } } : {}) };
};
const goals: Option[] = [{ id: "launch", label: "Lancer une activité" }, { id: "redesign", label: "Moderniser un site existant" }, { id: "campaign", label: "Présenter une offre ou une campagne" }];

export function questionnaireFor(sector: Sector): QuestionnaireSchema {
  const profile = sectorQuestions[sector.id];
  if (!profile) throw new Error(`Missing sector questionnaire profile: ${sector.id}`);
  const paymentGuidance = customerPaymentGuidanceFor(sector);
  const actions: Option[] = sector.id === "ticketing"
    ? [{ id: "browse-tickets", label: "Consulter les informations de billetterie" }, { id: "access-info", label: "Connaître les conditions d’accès" }, { id: "contact", label: "Contacter l’organisateur" }]
    : sector.id === "fundraising"
    ? [{ id: "campaign", label: "Consulter la campagne" }, { id: "information", label: "Demander des informations" }, { id: "contact", label: "Nous contacter" }]
    : sector.id === "finance"
      ? [{ id: "services", label: "Consulter les informations générales" }, { id: "information", label: "Demander des informations" }, { id: "contact", label: "Nous contacter" }]
      : sector.id === "saas"
        ? [{ id: "demo", label: "Demander une démonstration" }, { id: "features", label: "Découvrir les fonctionnalités" }, { id: "contact", label: "Nous contacter" }]
        : sector.flow === "order" ? [{ id: "browse", label: "Parcourir un catalogue" }, { id: "request", label: "Demander une commande" }, { id: "contact", label: "Nous contacter" }]
          : sector.flow === "booking" ? [{ id: "request-date", label: "Demander une date ou un rendez-vous" }, { id: "view-services", label: "Consulter les prestations" }, { id: "contact", label: "Nous contacter" }]
            : sector.flow === "application" ? [{ id: "apply", label: "Déposer une demande ou candidature" }, { id: "learn", label: "Consulter les informations" }, { id: "contact", label: "Nous contacter" }]
              : sector.flow === "content" ? [{ id: "browse-content", label: "Parcourir les contenus" }, { id: "subscribe", label: "Suivre les nouveautés" }, { id: "contact", label: "Nous contacter" }]
                : [{ id: "quote", label: "Demander un devis" }, { id: "contact", label: "Nous contacter" }, { id: "learn", label: "Découvrir les services" }];

  const questions = [
    question("project-goal", "singleChoice", "Quel est l’objectif principal du site ?", "Votre réponse affiche les précisions utiles pour une refonte ou une campagne.", goals),
    question("campaign-context", "longText", "Quel message, objectif et échéance faut-il présenter ?", "Ajoutez les informations publiques qui aident les visiteurs à comprendre la campagne.", undefined, [{ questionId: "project-goal", operator: "equals", value: "campaign" }]),
    question("redesign-focus", "longText", "Que faut-il conserver ou améliorer sur le site actuel ?", "Précisez les pages et éléments à reprendre ou à faire évoluer.", undefined, [{ questionId: "project-goal", operator: "equals", value: "redesign" }]),
    question("organization-name", "shortText", "Quel nom faut-il afficher ?", "Nom de l’entreprise, du projet ou de la personne."),
    question("audience", "longText", "À qui s’adresse votre offre ?", "Décrivez vos visiteurs ou clients principaux."),
    question("offer", "longText", `Que souhaitez-vous présenter pour ${sector.name.toLowerCase()} ?`, sector.detail),
    question("primary-action", "singleChoice", "Quelle action les visiteurs doivent-ils pouvoir faire ?", undefined, actions),
    question("accept-customer-payments", "yesNo", "Votre site doit-il encaisser les paiements de vos clients ?", "Ce choix concerne vos clients, indépendamment de l’achat du template. Aucune opération de paiement n’est activée dans cet aperçu."),
    question("customer-payment-uses", "multipleChoice", "Pour quels parcours souhaitez-vous prévoir un paiement ?", `${paymentGuidance} Les tarifs, devises et moyens de paiement seront définis après validation des services.`, [
      { id: "registration", label: "Inscription ou candidature" }, { id: "order", label: "Commande de produits ou services" },
      { id: "booking", label: "Réservation ou acompte" },
    ], [{ questionId: "accept-customer-payments", operator: "equals", value: true }]),
    question("sector-choice", "singleChoice", profile.prompt, "Les choix ci-dessous adaptent les détails demandés ensuite.", [...optionList(profile.choices), { id: "other", label: "Autre" }]),
    question("sector-choice-detail", "longText", profile.followUp, "Décrivez uniquement les informations publiques nécessaires.", undefined, [{ questionId: "sector-choice", operator: "notEquals", value: "other" }]),
    ...(sector.id === "ticketing" ? [
      question("ticket-general-access", "longText", "Quelles informations d’accès faut-il prévoir pour l’entrée générale ?", "Précisez les règles qui seront confirmées par l’organisateur, sans annoncer de prix ni de disponibilités.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-1" }]),
      question("ticket-seating-detail", "longText", "Quelles catégories de places et règles de placement souhaitez-vous expliquer ?", "Un plan de salle et les capacités ne seront publiés qu’après validation de l’organisateur.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-2" }]),
      question("ticket-pass-detail", "longText", "Quelles journées, activités ou conditions le pass doit-il couvrir ?", "Décrivez le contenu envisagé; la vente restera désactivée tant que les modalités ne sont pas validées.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-3" }]),
    ] : []),
    ...(sector.id === "real-estate" ? [
      question("real-estate-home-detail", "longText", "Quelles caractéristiques vérifiées du logement voulez-vous présenter ?", "Indiquez seulement les informations autorisées par le propriétaire et que l’agence pourra confirmer.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-1" }]),
      question("real-estate-land-detail", "longText", "Quelles informations vérifiées sur le terrain peuvent aider une visite ?", "Précisez les éléments publics à confirmer, comme l’accès ou les documents disponibles; ne publiez aucune donnée personnelle.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-2" }]),
      question("real-estate-commercial-detail", "longText", "Quel usage et quels critères le local commercial doit-il présenter ?", "Décrivez les caractéristiques confirmées et les règles de visite; ne supposez ni disponibilité ni autorisation d’usage.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-3" }]),
    ] : []),
    ...(sector.id === "hospitality" ? [
      question("hospitality-room-detail", "longText", "Quelles caractéristiques vérifiées de la chambre faut-il présenter ?", "Décrivez seulement les équipements réellement disponibles; tarifs, capacité et disponibilité restent à confirmer.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-1" }]),
      question("hospitality-home-detail", "longText", "Quelles informations faut-il donner sur la maison ou l’appartement ?", "Précisez les espaces, équipements et règles de séjour autorisés; l’adresse et les disponibilités restent à confirmer.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-2" }]),
      question("hospitality-group-detail", "longText", "Quelles conditions faut-il préciser pour un séjour de groupe ?", "Décrivez les espaces communs et limites confirmés; ne publiez aucune capacité non vérifiée.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-3" }]),
    ] : []),
    ...(sector.id === "tourism" ? [
      question("tourism-nature-detail", "longText", "Quel rythme, niveau de marche et équipement faut-il prévoir pour cette excursion nature ?", "Ne publiez que les éléments confirmés par le guide; horaires, accès et prix restent à valider.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-1" }]),
      question("tourism-circuit-detail", "longText", "Quelles étapes et quels moyens de transport le circuit comprend-il ?", "Détaillez uniquement le parcours validé; lieux de rendez-vous et horaires restent à confirmer.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-2" }]),
      question("tourism-experience-detail", "longText", "Quel matériel, quelles conditions et quels accompagnements nécessitent cette expérience ?", "Mentionnez les consignes confirmées par l’équipe locale; tarifs et capacités ne sont pas encore publiés.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-3" }]),
    ] : []),
    ...(sector.id === "vehicles" ? [
      question("vehicles-stock-detail", "longText", "Quelles caractéristiques vérifiées du véhicule voulez-vous présenter ?", "Précisez le type, le modèle et les éléments documentés; prix, état et disponibilité seront confirmés avant publication.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-1" }]),
      question("vehicles-rental-detail", "longText", "Quelles conditions de location faut-il expliquer au client ?", "Durée, dépôt, couverture et disponibilité sont à confirmer avec le propriétaire; ne publiez aucun tarif non validé.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-2" }]),
      question("vehicles-service-detail", "longText", "Quels services, étapes et critères faut-il détailler pour l’entretien ou l’essai ?", "Décrivez les services réellement disponibles et les conditions que l’équipe peut confirmer.", undefined, [{ questionId: "sector-choice", operator: "equals", value: "choice-3" }]),
    ] : []),
    question("sector-other-detail", "longText", "Précisez votre besoin pour ce secteur.", undefined, undefined, [{ questionId: "sector-choice", operator: "equals", value: "other" }]),
    question("action-detail", "longText", sector.id === "fundraising"
      ? "Quelles informations publiques doivent expliquer la campagne ?"
      : sector.id === "finance"
        ? "Quelles coordonnées et informations générales doivent être visibles ?"
        : sector.flow === "order"
          ? "Quelles options, informations de commande ou modalités de retrait faut-il expliquer ?"
          : sector.flow === "booking"
            ? "Quelles durées, disponibilités, zones ou règles de report faut-il préciser ?"
            : sector.flow === "application"
              ? "Quelles étapes, dates ou pièces non sensibles sont nécessaires pour cette demande ?"
              : sector.flow === "content"
                ? "Quels contenus, rubriques ou informations complémentaires faut-il montrer ?"
                : "Quelles informations publiques faut-il préciser pour cette action ?", "Ne demandez pas de données sensibles ou confidentielles.", undefined, [{ questionId: "primary-action", operator: "notEquals", value: "contact" }]),
    question("has-existing-site", "yesNo", "Avez-vous déjà un site ou des contenus à reprendre ?"),
    question("existing-site", "shortText", "Où peut-on consulter votre site ou vos contenus actuels ?", "Indiquez une adresse web ou décrivez les éléments disponibles.", undefined, [{ questionId: "has-existing-site", operator: "equals", value: true }]),
    question("visual-style", "singleChoice", "Quel style visuel vous correspond ?", undefined, [{ id: "minimal", label: "Épuré et clair" }, { id: "warm", label: "Chaleureux et accueillant" }, { id: "bold", label: "Coloré et expressif" }, { id: "elegant", label: "Élégant et premium" }]),
    question("brand-color", "color", "Quelle couleur principale représente votre activité ?", "Choisissez une couleur; elle sera appliquée à l’aperçu local.", undefined, undefined, false),
    question("contact-method", "singleChoice", "Comment souhaitez-vous recevoir les demandes ?", undefined, [{ id: "email", label: "Courriel" }, { id: "phone", label: "Téléphone ou messagerie" }, { id: "form", label: "Formulaire sur le site" }]),
    question("email", "email", "Quelle adresse courriel afficher ?", "Utilisez une adresse professionnelle de contact.", undefined, [{ questionId: "contact-method", operator: "equals", value: "email" }]),
    question("phone", "phone", "Quel numéro de contact afficher ?", "Indiquez l’indicatif international si nécessaire.", undefined, [{ questionId: "contact-method", operator: "equals", value: "phone" }]),
    question("timeline", "singleChoice", "Quand souhaitez-vous mettre le site en ligne ?", undefined, [{ id: "soon", label: "Dès que possible" }, { id: "month", label: "Dans le mois" }, { id: "planning", label: "Je planifie encore" }]),
    question("notes", "longText", "Y a-t-il une précision importante pour le modèle ?", "N’inscrivez pas de données sensibles ou confidentielles.", undefined, undefined, false),
    question("included-sections", "multipleChoice", "Quelles sections voulez-vous afficher ?", "Vous pourrez ajuster ce choix plus tard.",
      Object.entries(getSectorSectionLabels(sector)).map(([id, label]) => ({ id, label })), undefined, false),
  ];
  return { schemaId: `sector-${sector.id}`, schemaVersion: sector.id === "vehicles" ? "1.11.0" : sector.id === "tourism" ? "1.10.0" : sector.id === "hospitality" ? "1.9.0" : sector.id === "real-estate" ? "1.8.0" : sector.id === "ticketing" ? "1.7.0" : "1.6.0", locale: "fr-HT", questions };
}
