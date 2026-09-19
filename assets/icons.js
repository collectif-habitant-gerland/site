// Icônes au trait (24×24) et visages de l'échelle de satisfaction.
(function () {
  const P = {
    information: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6l-5 4H4a1 1 0 0 0-1 1z M15 9.5a3.5 3.5 0 0 1 0 5 M18 6.5a7.5 7.5 0 0 1 0 11',
    ecoute: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z M8.5 12h.01 M12 12h.01 M15.5 12h.01',
    acces: 'M6 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17 M3 21h18 M13.5 12.5h.01',
    garages: 'M3 21V9l9-5 9 5v12 M7 21v-7h10v7 M7 17h10',
    eau: 'M12 3s6 6.3 6 10.8a6 6 0 0 1-12 0C6 9.3 12 3 12 3z',
    chauffage: 'M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z M12 9v7',
    ascenseurs: 'M5 3h14v18H5z M9.5 9.5 12 7l2.5 2.5 M9.5 14.5 12 17l2.5-2.5',
    proprete: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v5.5 M14 11v5.5',
    nuisibles: 'M8 10a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0z M12 10v8 M4 11h4 M16 11h4 M4.5 17l3.5-1.5 M19.5 17 16 15.5 M9.5 6 8 3.5 M14.5 6 16 3.5',
    etat: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
    quartier: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    batiment: 'M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16 M14 9h5a1 1 0 0 1 1 1v11 M2 21h20 M8 8h2 M8 12h2 M8 16h2 M17 13h.01 M17 17h.01',
    retour: 'M15 18l-6-6 6-6',
    fermer: 'M6 6l12 12 M18 6 6 18',
    valider: 'M5 12.5l4.5 4.5L19 7',
    suivant: 'M9 18l6-6-6-6',
    ameliore: 'M3 17l6-6 4 4 8-8 M15 7h6v6',
    priorite: 'M5 21V4 M5 4h12l-2.5 4L17 12H5',
    modifier: 'M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4',
    avis: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
    signaler: 'M12 9v4 M12 17h.01 M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    avancees: 'M20 6 9 17l-5-5',
    coeur: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
    cadenas: 'M6 11h12v10H6z M8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
    horloge: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
    groupe: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20a6.5 6.5 0 0 1 13 0 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14a6.5 6.5 0 0 1 3.5 6',
    telecharger: 'M12 3v12 M7 10l5 5 5-5 M5 21h14',
    sortir: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
    reseau:'M2 8.5a15 15 0 0 1 20 0 M5.5 12a10 10 0 0 1 13 0 M9 15.5a5 5 0 0 1 6 0 M12 19h.01 M3 3l18 18'
  };

  function icone(nom, classe) {
    const d = P[nom] || '';
    return '<svg class="ic ' + (classe || '') + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      d.split(' M').map((p, i) => '<path d="' + (i ? 'M' : '') + p + '"/>').join('') + '</svg>';
  }

  // Visages : 1 = très mal … 4 = très bien.
  const BOUCHES = {
    1: 'M8 16.8c1.2-1.7 2.5-2.4 4-2.4s2.8.7 4 2.4',
    2: 'M8.6 16c1-.6 2.1-.9 3.4-.9s2.4.3 3.4.9',
    3: 'M8.6 14.6c1 .8 2.1 1.2 3.4 1.2s2.4-.4 3.4-1.2',
    4: 'M7.6 13.6c1.1 2.1 2.6 3.1 4.4 3.1s3.3-1 4.4-3.1'
  };
  function visage(valeur) {
    return '<svg class="visage v' + valeur + '" viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10.5" class="visage-fond"/>' +
      '<circle cx="8.7" cy="10" r="1.25" class="visage-trait-plein"/>' +
      '<circle cx="15.3" cy="10" r="1.25" class="visage-trait-plein"/>' +
      '<path d="' + BOUCHES[valeur] + '" class="visage-trait" fill="none" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>';
  }

  window.VoixIcons = { icone, visage };
})();
