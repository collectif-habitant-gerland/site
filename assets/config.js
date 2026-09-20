// Contenu du site : bâtiments, période en cours et thèmes du baromètre.
// Tout ce qui est affiché aux habitants se règle ici.
window.VOIX_CONFIG = {
  residence: 'gerland',
  periode: { id: '2026-09', libelle: 'septembre 2026' },

  // Signature du compte rendu envoyé au bailleur (modifiable à chaque envoi depuis le cockpit).
  signature: 'Les résidents Erilia – Debourg',
  adresses: '11 rue Jacques-Monod · 44, 48 et 50 avenue Debourg',

  // Nombre de logements de la résidence (d'après le décompte des compteurs d'eau chaude cité dans le groupe : 87).
  logements: 87,

  batiments: [
    { id: '11', libelle: '11', rue: 'rue Jacques-Monod' },
    { id: '44', libelle: '44', rue: 'avenue Debourg' },
    { id: '48', libelle: '48', rue: 'avenue Debourg' },
    { id: '50', libelle: '50', rue: 'avenue Debourg' }
  ],

  // Échelle des smileys, de 1 (très mal) à 4 (très bien).
  echelle: [
    { valeur: 1, libelle: 'Très mal' },
    { valeur: 2, libelle: 'Plutôt mal' },
    { valeur: 3, libelle: 'Plutôt bien' },
    { valeur: 4, libelle: 'Très bien' }
  ],

  // Problèmes signalables, tirés des situations vécues dans la résidence.
  problemes: {
    information: [
      { id: 'information-1', libelle: 'Aucune affiche lors d’une panne' },
      { id: 'information-2', libelle: 'Coupure non annoncée' },
      { id: 'information-3', libelle: 'Intervention non annoncée' },
      { id: 'information-4', libelle: 'Absence de la responsable non signalée' },
      { id: 'information-5', libelle: 'Numéros d’urgence non affichés' },
      { id: 'information-6', libelle: 'Planning de ménage non affiché' }
    ],
    ecoute: [
      { id: 'ecoute-1', libelle: 'Impossible de joindre quelqu’un' },
      { id: 'ecoute-2', libelle: 'Demande restée sans réponse' },
      { id: 'ecoute-3', libelle: 'Rendez-vous non tenu' },
      { id: 'ecoute-4', libelle: 'Intervention à refaire' },
      { id: 'ecoute-5', libelle: 'Promesse sans suite' }
    ],
    acces: [
      { id: 'acces-1', libelle: 'Porte d’entrée qui ne ferme plus' },
      { id: 'acces-2', libelle: 'Porte d’entrée restée ouverte' },
      { id: 'acces-3', libelle: 'Badge qui ne fonctionne pas' },
      { id: 'acces-4', libelle: 'Interphone en panne' },
      { id: 'acces-5', libelle: 'Boîte aux lettres forcée ou ouverte' },
      { id: 'acces-6', libelle: 'Local poubelle ou technique ouvert' },
      { id: 'acces-7', libelle: 'Personne inconnue dans les parties communes' },
      { id: 'acces-8', libelle: 'Personnes qui dorment dans le hall ou l’escalier' }
    ],
    garages: [
      { id: 'garages-1', libelle: 'Portail en panne ou bloqué' },
      { id: 'garages-2', libelle: 'Porte de garage restée ouverte' },
      { id: 'garages-3', libelle: 'Serrure cassée' },
      { id: 'garages-4', libelle: 'Personnes qui dorment ou s’installent' },
      { id: 'garages-9', libelle: 'Attroupements, allées et venues suspectes' },
      { id: 'garages-10', libelle: 'Traces de squat (matelas, affaires, feu)' },
      { id: 'garages-5', libelle: 'Box fracturé ou vol' },
      { id: 'garages-6', libelle: 'Véhicule dégradé' },
      { id: 'garages-7', libelle: 'Déchets ou urine' },
      { id: 'garages-8', libelle: 'Éclairage en panne' }
    ],
    eau: [
      { id: 'eau-1', libelle: 'Fuite au plafond ou dans les communs' },
      { id: 'eau-2', libelle: 'Évacuation bouchée, eaux qui remontent' },
      { id: 'eau-3', libelle: 'Odeur d’égout' },
      { id: 'eau-4', libelle: 'Pas d’eau chaude' },
      { id: 'eau-5', libelle: 'Eau chaude trop longue à venir' },
      { id: 'eau-6', libelle: 'Coupure d’eau sans prévenir' },
      { id: 'eau-7', libelle: 'Eau colorée' }
    ],
    chauffage: [
      { id: 'chauffage-1', libelle: 'Radiateurs froids' },
      { id: 'chauffage-2', libelle: 'Chauffage pas encore lancé' },
      { id: 'chauffage-3', libelle: 'Ventilation (VMC) à l’arrêt' },
      { id: 'chauffage-4', libelle: 'Humidité ou moisissures' },
      { id: 'chauffage-5', libelle: 'Logement surchauffé l’été' }
    ],
    ascenseurs: [
      { id: 'ascenseurs-1', libelle: 'Ascenseur en panne' },
      { id: 'ascenseurs-2', libelle: 'Portes qui bloquent' },
      { id: 'ascenseurs-3', libelle: 'Ascenseur sale' },
      { id: 'ascenseurs-4', libelle: 'Panne qui dure depuis plusieurs jours' }
    ],
    proprete: [
      { id: 'proprete-1', libelle: 'Local poubelle débordant' },
      { id: 'proprete-2', libelle: 'Encombrants déposés' },
      { id: 'proprete-3', libelle: 'Hall ou escaliers non nettoyés' },
      { id: 'proprete-4', libelle: 'Déjections ou urine' },
      { id: 'proprete-5', libelle: 'Déchets jetés des fenêtres' },
      { id: 'proprete-6', libelle: 'Tags' }
    ],
    nuisibles: [
      { id: 'nuisibles-1', libelle: 'Rats ou souris' },
      { id: 'nuisibles-2', libelle: 'Cafards' },
      { id: 'nuisibles-3', libelle: 'Punaises de lit' },
      { id: 'nuisibles-4', libelle: 'Passage de désinsectisation manqué' }
    ],
    etat: [
      { id: 'etat-1', libelle: 'Équipement cassé ou vandalisé' },
      { id: 'etat-2', libelle: 'Malfaçon des travaux' },
      { id: 'etat-3', libelle: 'Danger (câble, marche, objet instable)' },
      { id: 'etat-4', libelle: 'Boîte aux lettres cassée' },
      { id: 'etat-5', libelle: 'Fenêtre ou volet abîmé' }
    ],
    quartier: [
      { id: 'quartier-1', libelle: 'Seringues' },
      { id: 'quartier-2', libelle: 'Deal ou attroupements' },
      { id: 'quartier-3', libelle: 'Agression ou vol' },
      { id: 'quartier-4', libelle: 'Campement' },
      { id: 'quartier-5', libelle: 'Rue sale' },
      { id: 'quartier-6', libelle: 'Éclairage public en panne' }
    ]
  },

  // Les thèmes viennent des préoccupations relevées dans le groupe du collectif.
  // Uniquement du collectif : aucune question sur les charges, le loyer ou une situation personnelle.
  themes: [
    { id: 'information', icone: 'information', titre: 'Information et affichage',
      detail: 'Affiches lors d’une panne, d’une coupure, d’une intervention, d’une absence de la responsable de résidence.',
      demande: 'Afficher dans chaque hall, au fil de l’eau, les pannes, coupures et interventions prévues, et indiquer qui contacter en l’absence de la responsable de résidence.' },
    { id: 'ecoute', icone: 'ecoute', titre: 'Écoute et réactivité du bailleur',
      detail: 'Joindre quelqu’un, obtenir une intervention, avoir un suivi.',
      demande: 'Garantir un interlocuteur joignable, un accusé de réception de chaque demande et un délai de réponse annoncé.' },
    { id: 'acces', icone: 'acces', titre: 'Accès et sécurité de l’immeuble',
      detail: 'Portes d’entrée, badges, interphone, boîtes aux lettres, intrusions.',
      demande: 'Réparer rapidement les portes, badges et interphones défaillants, et sécuriser les boîtes aux lettres.' },
    { id: 'garages', icone: 'garages', titre: 'Garages et sous-sols',
      detail: 'Portail et portes, squat, effractions, propreté, éclairage.',
      demande: 'Maintenir le portail et les portes des garages fermés et en état de marche, et prévenir l’occupation des sous-sols.' },
    { id: 'eau', icone: 'eau', titre: 'Eau et évacuations',
      detail: 'Fuites, colonnes qui remontent, eau chaude, coupures.',
      demande: 'Traiter durablement les fuites et les colonnes d’évacuation, et annoncer par affichage toute coupure d’eau.' },
    { id: 'chauffage', icone: 'chauffage', titre: 'Chauffage et air',
      detail: 'Radiateurs, ventilation (VMC), humidité, chaleur l’été.',
      demande: 'Mettre en route le chauffage à temps, entretenir la ventilation (VMC) et suivre les cas d’humidité.' },
    { id: 'ascenseurs', icone: 'ascenseurs', titre: 'Ascenseurs',
      detail: 'Pannes, portes qui bloquent, propreté.',
      demande: 'Réduire la durée des pannes et afficher la date prévue de remise en service.' },
    { id: 'proprete', icone: 'proprete', titre: 'Propreté et déchets',
      detail: 'Local poubelle, encombrants, ménage des halls et escaliers.',
      demande: 'Assurer un entretien régulier des halls et escaliers, et organiser l’enlèvement des encombrants.' },
    { id: 'nuisibles', icone: 'nuisibles', titre: 'Nuisibles',
      detail: 'Rats, souris, cafards, punaises de lit.',
      demande: 'Programmer des traitements réguliers et annoncés contre les rats et les insectes.' },
    { id: 'etat', icone: 'etat', titre: 'État de la résidence',
      detail: 'Dégradations, malfaçons restantes, équipements cassés, dangers.',
      demande: 'Recenser puis reprendre les malfaçons restantes et les équipements dégradés.' },
    { id: 'quartier', icone: 'quartier', titre: 'Abords et quartier',
      detail: 'Sécurité et propreté autour de la résidence.',
      demande: 'Relayer auprès de la Ville de Lyon et de la Métropole les questions de sécurité et de propreté aux abords de la résidence.' }
  ]
};
