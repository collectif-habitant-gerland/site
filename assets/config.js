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
