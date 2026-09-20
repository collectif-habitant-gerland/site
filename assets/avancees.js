// Ce qui a changé : la frise des avancées obtenues, écrite par le pilote.
(function () {
  const C = window.VOIX_CONFIG;
  const { icone } = window.VoixIcons;

  firebase.initializeApp(window.VOIX_FIREBASE);
  const db = firebase.firestore();

  const $ecran = document.getElementById('ecran');
  document.getElementById('btn-retour').innerHTML = icone('retour');
  document.getElementById('btn-fermer').innerHTML = icone('fermer');
  document.getElementById('btn-retour').addEventListener('click', () => { location.href = 'index.html'; });
  document.getElementById('btn-fermer').addEventListener('click', () => { location.href = 'index.html'; });

  const theme = id => C.themes.find(t => t.id === id) || null;
  const dateFr = d => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
    if (!m) return '';
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  function rendre(liste) {
    const entete = '<div class="question"><div class="question-theme">' + icone('avancees') + 'Ce qui a changé</div>' +
      '<h2>Les avancées obtenues</h2>' +
      '<p class="detail">Ce que nos signalements et nos démarches ont permis de faire bouger dans la résidence.</p></div>';
    if (!liste.length) {
      $ecran.innerHTML = entete + '<div class="encart-info">' + icone('coeur') +
        '<span>La première avancée sera ajoutée ici dès qu’une demande aboutira. Continuez à donner votre avis et à signaler : c’est ce qui fait bouger les choses.</span></div>';
      return;
    }
    $ecran.innerHTML = entete + '<ol class="frise">' + liste.map(a => {
      const t = theme(a.theme);
      return '<li class="frise-item"><div class="frise-ic">' + icone('valider') + '</div>' +
        '<div class="frise-corps"><span class="frise-date">' + esc(dateFr(a.date)) + (t ? ' · ' + esc(t.titre) : '') + '</span>' +
        '<strong>' + esc(a.titre) + '</strong>' + (a.texte ? '<p>' + esc(a.texte).replace(/\n/g, '<br>') + '</p>' : '') + '</div></li>';
    }).join('') + '</ol>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  db.collection('avancees').onSnapshot(snap => {
    const liste = snap.docs.map(d => Object.assign({ id: d.id }, d.data()))
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    rendre(liste);
  }, () => {
    $ecran.innerHTML = '<div class="chargement">Impossible de charger les avancées. Vérifiez votre connexion.</div>';
  });
})();
