// Signaler un problème : thème, puis problème. Deux touches, un compteur partagé.
(function () {
  const C = window.VOIX_CONFIG;
  const { icone } = window.VoixIcons;
  const CLE_MIENS = 'voix.signales';

  firebase.initializeApp(window.VOIX_FIREBASE);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const $ecran = document.getElementById('ecran');
  const $retour = document.getElementById('btn-retour');
  const $fermer = document.getElementById('btn-fermer');
  const $progTexte = document.getElementById('progression-texte');
  $retour.innerHTML = icone('retour');
  $fermer.innerHTML = icone('fermer');

  let signalements = {};     // état partagé, par problème
  let theme = null;          // thème ouvert
  let envoiEnCours = false;

  const miens = () => { try { return JSON.parse(localStorage.getItem(CLE_MIENS)) || {}; } catch (e) { return {}; } };
  const noterMien = (id, quoi) => {
    const m = miens();
    m[id] = Object.assign({}, m[id], { [quoi]: true });
    try { localStorage.setItem(CLE_MIENS, JSON.stringify(m)); } catch (e) { /* ignoré */ }
  };

  async function utilisateur() {
    if (auth.currentUser) return auth.currentUser;
    return (await auth.signInAnonymously()).user;
  }

  const dateDe = s => (s && s.toDate) ? s.toDate() : null;
  function depuis(s) {
    const d = dateDe(s);
    if (!d) return '';
    const jours = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (jours <= 0) return 'aujourd’hui';
    if (jours === 1) return 'depuis hier';
    return 'depuis ' + jours + ' jours';
  }

  // ---------- Navigation ----------
  function aller(t) {
    theme = t;
    history.pushState({ theme: t }, '', t ? '#' + t : '#');
    rendre('avant');
  }
  $retour.addEventListener('click', () => history.back());
  $fermer.addEventListener('click', () => { location.href = 'index.html'; });
  window.addEventListener('popstate', e => { theme = (e.state && e.state.theme) || null; rendre('arriere'); });

  // ---------- Affichage ----------
  function rendre(sens) {
    $retour.hidden = !theme;
    $progTexte.textContent = theme ? 'Choisissez le problème' : '';
    $ecran.innerHTML = theme ? ecranProblemes() : ecranThemes();
    $ecran.className = 'ecran' + (sens ? ' entre-' + sens : '');
    brancher();
    window.scrollTo(0, 0);
  }

  function ouverts() {
    return Object.values(signalements).filter(s => s.statut !== 'regle');
  }

  function ecranThemes() {
    const enCours = ouverts();
    const total = enCours.reduce((n, s) => n + (s.total || 0), 0);
    return '<div class="question"><div class="question-theme">' + icone('signaler') + 'Signaler un problème</div>' +
      '<h2>Qu’est-ce qui ne va pas ?</h2>' +
      '<p class="detail">Choisissez le domaine, puis le problème. Deux touches, c’est tout. Anonyme.</p>' +
      (enCours.length ? '<div class="encart-info">' + icone('groupe') + '<span><strong>' + enCours.length + ' problème' + (enCours.length > 1 ? 's' : '') + ' en cours</strong> dans la résidence, signalé' + (enCours.length > 1 ? 's' : '') + ' ' + total + ' fois par vos voisins.</span></div>' : '') +
      '<div class="grille-themes">' + C.themes.map(t => {
        const n = enCours.filter(s => s.theme === t.id).length;
        return '<button type="button" class="tuile-theme" data-theme="' + t.id + '">' +
          '<span class="tuile-theme-ic">' + icone(t.icone) + '</span><span class="tuile-theme-titre">' + esc(t.titre) + '</span>' +
          (n ? '<span class="pastille-nb">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div></div>';
  }

  function ecranProblemes() {
    const t = C.themes.find(x => x.id === theme) || {};
    const liste = (C.problemes[theme] || []);
    const m = miens();
    return '<div class="question"><div class="question-theme">' + icone(t.icone || 'signaler') + esc(t.titre || '') + '</div>' +
      '<h2>Que se passe-t-il ?</h2><p class="detail">Touchez le problème que vous rencontrez.</p>' +
      '<div class="liste-choix">' + liste.map(p => {
        const s = signalements[p.id];
        const ouvert = s && s.statut !== 'regle';
        const dejaMoi = m[p.id] && m[p.id].signale;
        return '<button type="button" class="choix-ligne probleme' + (ouvert ? ' actif' : '') + '" data-probleme="' + p.id + '"' + (dejaMoi ? ' data-mien="1"' : '') + '>' +
          '<span class="choix-texte">' + esc(p.libelle) +
          (ouvert ? '<small>' + (s.total || 1) + ' voisin' + ((s.total || 1) > 1 ? 's' : '') + ' · signalé ' + depuis(s.premierLe) + '</small>' : '') +
          '</span>' + (dejaMoi ? '<span class="coche vert">' + icone('valider') + '</span>' : '<span class="fleche">' + icone('suivant') + '</span>') + '</button>';
      }).join('') + '</div>' +
      (liste.some(p => signalements[p.id] && signalements[p.id].statut !== 'regle')
        ? '<p class="detail" style="margin-top:20px">Un problème est réglé ? Touchez-le, puis « C’est réglé ».</p>' : '') +
      '</div>';
  }

  function ecranMerci(p, s, repare) {
    const n = s ? (repare ? s.repares : s.total) : 1;
    return '<div class="merci"><div class="merci-ic">' + icone('valider') + '</div>' +
      '<h2>' + (repare ? 'Merci !' : 'C’est signalé') + '</h2>' +
      '<p>' + esc(p.libelle) + (repare ? ' : vous avez indiqué que c’est réglé.' : '') + '</p>' +
      '<div class="compteur"><strong>' + n + '</strong><span>' +
      (repare
        ? 'voisin' + (n > 1 ? 's ont' : ' a') + ' indiqué que c’est réglé.'
        : 'voisin' + (n > 1 ? 's ont' : ' a') + ' signalé ce problème. Ensemble, on pèse.') + '</span></div>' +
      '<div class="actions"><button type="button" class="btn btn-principal" data-action="encore">Signaler autre chose</button>' +
      '<a class="btn btn-secondaire" href="index.html">Retour à l’accueil</a></div></div>';
  }

  // ---------- Actions ----------
  function brancher() {
    $ecran.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => aller(b.dataset.theme)));
    $ecran.querySelectorAll('[data-probleme]').forEach(b => b.addEventListener('click', () => choisir(b.dataset.probleme)));
    $ecran.querySelectorAll('[data-action="encore"]').forEach(b => b.addEventListener('click', () => { theme = null; history.pushState({ theme: null }, '', '#'); rendre('arriere'); }));
  }

  async function choisir(id) {
    const p = (C.problemes[theme] || []).find(x => x.id === id);
    if (!p) return;
    const s = signalements[id];
    const ouvert = s && s.statut !== 'regle';
    const m = miens()[id] || {};
    const choix = await feuille(p, s, ouvert, m);
    if (!choix) return;
    envoyer(p, choix === 'repare');
  }

  // Feuille de choix : signaler / moi aussi / c'est réglé
  function feuille(p, s, ouvert, m) {
    return new Promise(resolve => {
      const voile = document.createElement('div');
      voile.className = 'voile';
      const dejaSignale = m.signale;
      const dejaRepare = m.repare;
      voile.innerHTML = '<div class="dialogue" role="dialog" aria-modal="true" aria-labelledby="f-titre">' +
        '<h3 id="f-titre">' + esc(p.libelle) + '</h3>' +
        '<p>' + (ouvert ? esc((s.total || 1) + ' voisin' + ((s.total || 1) > 1 ? 's l’ont' : ' l’a') + ' signalé ' + depuis(s.premierLe) + '.') : 'Personne ne l’a encore signalé.') + '</p>' +
        '<div class="actions" style="margin-top:0">' +
        (dejaSignale
          ? '<div class="encart-info" style="margin:0 0 10px"><span>Vous avez déjà signalé ce problème. Merci !</span></div>'
          : '<button type="button" class="btn btn-principal" data-f="signaler">' + icone('signaler') + (ouvert ? 'Moi aussi, je le signale' : 'Je le signale') + '</button>') +
        (ouvert && !dejaRepare ? '<button type="button" class="btn btn-secondaire" data-f="repare">' + icone('valider') + 'C’est réglé' + '</button>' : '') +
        '<button type="button" class="btn btn-discret" data-f="">Annuler</button></div></div>';
      const fermer = r => { voile.remove(); document.removeEventListener('keydown', clavier); resolve(r); };
      const clavier = e => { if (e.key === 'Escape') fermer(null); };
      voile.addEventListener('click', e => {
        if (e.target === voile) return fermer(null);
        const b = e.target.closest('[data-f]');
        if (b) fermer(b.dataset.f || null);
      });
      document.addEventListener('keydown', clavier);
      document.body.appendChild(voile);
    });
  }

  async function envoyer(p, repare) {
    if (envoiEnCours) return;
    envoiEnCours = true;
    const patiente = document.createElement('div');
    patiente.className = 'voile';
    patiente.innerHTML = '<div class="dialogue"><h3>Envoi…</h3></div>';
    document.body.appendChild(patiente);
    try {
      if (!navigator.onLine) throw new Error('hors-ligne');
      const u = await utilisateur();
      const ref = db.collection('signalements').doc(p.id);
      const sous = repare ? 'repares' : 'votants';
      const avant = await ref.get();
      const lot = db.batch();
      lot.set(ref.collection(sous).doc(u.uid), { le: firebase.firestore.FieldValue.serverTimestamp() });
      const champs = {
        theme, probleme: p.libelle,
        dernierLe: firebase.firestore.FieldValue.serverTimestamp(),
        total: firebase.firestore.FieldValue.increment(repare ? 0 : 1),
        repares: firebase.firestore.FieldValue.increment(repare ? 1 : 0)
      };
      if (!avant.exists) {
        champs.statut = 'ouvert';
        champs.premierLe = firebase.firestore.FieldValue.serverTimestamp();
        champs.repares = 0;
      }
      lot.set(ref, champs, { merge: true });
      await lot.commit();
      noterMien(p.id, repare ? 'repare' : 'signale');
      const apres = (await ref.get()).data();
      signalements[p.id] = apres;
      patiente.remove();
      $ecran.innerHTML = ecranMerci(p, apres, repare);
      $ecran.className = 'ecran entre-avant';
      $retour.hidden = true;
      $progTexte.textContent = '';
      brancher();
    } catch (e) {
      patiente.remove();
      const deja = e && e.code === 'permission-denied';
      alerte(deja
        ? 'Vous avez déjà signalé ce problème depuis cet appareil. Merci !'
        : 'L’envoi n’a pas abouti. Vérifiez votre connexion et réessayez.');
    } finally {
      envoiEnCours = false;
    }
  }

  function alerte(texte) {
    const voile = document.createElement('div');
    voile.className = 'voile';
    voile.innerHTML = '<div class="dialogue" role="alertdialog"><h3>Information</h3><p>' + esc(texte) + '</p>' +
      '<div class="actions" style="margin-top:0"><button type="button" class="btn btn-principal" data-ok>J’ai compris</button></div></div>';
    voile.addEventListener('click', e => { if (e.target === voile || e.target.closest('[data-ok]')) voile.remove(); });
    document.body.appendChild(voile);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- Démarrage ----------
  history.replaceState({ theme: null }, '', location.pathname);
  db.collection('signalements').onSnapshot(snap => {
    signalements = {};
    snap.docs.forEach(d => { signalements[d.id] = d.data({ serverTimestamps: 'estimate' }); });
    rendre('');
  }, () => rendre(''));
  utilisateur().catch(() => { /* la connexion anonyme se fera à l’envoi */ });
})();
