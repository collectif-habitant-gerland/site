// Compte rendu figé, envoyé au bailleur : lecture seule, filtres, détail par thème, réponse aux résidents.
(function () {
  const { icone } = window.VoixIcons;
  const $r = document.getElementById('rapport');
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || '';
  const IMPRESSION = params.get('imprimer') === '1';
  const NIVEAUX = [
    { v: 1, lib: 'Très mal' }, { v: 2, lib: 'Plutôt mal' }, { v: 3, lib: 'Plutôt bien' }, { v: 4, lib: 'Très bien' }
  ];

  let R = null;             // le compte rendu
  let filtre = 'tous';      // bâtiment affiché
  let ouvert = null;        // thème dont le détail est ouvert
  let db = null;

  if (!/^[A-Za-z0-9]{12,40}$/.test(id)) return erreur('Lien incomplet', 'Vérifiez que le lien a été copié en entier.');

  try {
    firebase.initializeApp(window.VOIX_FIREBASE);
    db = firebase.firestore();
  } catch (e) { return erreur('Chargement impossible', 'Réessayez dans un instant.'); }

  db.collection('rapports').doc(id).get().then(doc => {
    if (!doc.exists) return erreur('Compte rendu introuvable', 'Ce lien n’est plus valable. Demandez un nouveau lien aux résidents.');
    R = doc.data();
    document.title = R.titre + ' – ' + R.signature;
    rendre();
    if (IMPRESSION) setTimeout(() => window.print(), 900);
  }).catch(() => erreur('Chargement impossible', 'Vérifiez votre connexion puis rechargez la page.'));

  function erreur(titre, texte) {
    $r.innerHTML = '<div class="rp-vide"><h1>' + esc(titre) + '</h1><p>' + esc(texte) + '</p></div>';
  }

  // ---------- Calculs ----------
  const somme = d => d ? (d[1] || 0) + (d[2] || 0) + (d[3] || 0) + (d[4] || 0) : 0;
  const pctSatisf = d => { const n = somme(d); return n ? Math.round(((d[3] || 0) + (d[4] || 0)) / n * 100) : null; };
  const theme = tid => R.themesDef.find(t => t.id === tid) || { id: tid, titre: tid, icone: 'avis' };
  function distDe(tid, bat) {
    const t = R.themes[tid];
    if (!t) return null;
    return bat === 'tous' ? t.tous : (t.bat && t.bat[bat]) || null;
  }
  function classement(bat) {
    return R.themesDef.map(t => ({ t, d: distDe(t.id, bat) }))
      .map(x => Object.assign(x, { n: somme(x.d), p: pctSatisf(x.d) }))
      .sort((a, b) => (a.p === null) - (b.p === null) || a.p - b.p);
  }
  function globale() {
    let s = 0, n = 0;
    R.themesDef.forEach(t => { const d = distDe(t.id, 'tous'); if (d) { s += (d[3] || 0) + (d[4] || 0); n += somme(d); } });
    return n ? Math.round(s / n * 100) : null;
  }
  const trie = obj => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);
  const lienEnLigne = () => location.origin + location.pathname + '?id=' + encodeURIComponent(id);
  const dateFr = iso => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  // ---------- Affichage ----------
  function rendre() {
    const cl = classement('tous');
    const notes = cl.filter(x => x.p !== null);
    const pire = notes[0];
    const meilleur = notes[notes.length - 1];
    const glob = globale();
    const prio = trie(R.priorites)[0];
    const taux = R.logements ? Math.round(R.total / R.logements * 100) : null;

    let h = '';

    // En-tête
    h += '<header class="rp-hero"><div class="rp-surtitre">' + icone('ecoute') + 'Compte rendu des résidents' + (R.destinataire ? ' · à l’attention de ' + esc(R.destinataire) : '') + '</div>' +
      '<h1>' + esc(R.titre) + '</h1>' +
      '<p class="rp-meta">' + esc(R.adresses || '') + '</p>' +
      '<p class="rp-meta">' + (R.du ? 'Avis recueillis du ' + esc(dateFr(R.du)) + ' au ' + esc(dateFr(R.au)) + ' · ' : '') + 'Transmis le ' + esc(dateFr(R.creeLe)) + '</p></header>';

    // Bloc imprimé : lien et QR code vers la version en ligne
    h += '<section class="rp-qr impression-seule"><div class="rp-qr-code">' + qrSvg(lienEnLigne()) + '</div><div><strong>Version en ligne, détaillée et interactive</strong>' +
      '<p>Scannez ce code ou ouvrez le lien ci-dessous. Vous pourrez aussi y répondre directement aux résidents.</p><p class="rp-lien">' + esc(lienEnLigne()) + '</p></div></section>';

    // Chiffres clés
    h += '<section class="rp-cles">' +
      cle('Participation', R.total + '<small> foyer' + (R.total > 1 ? 's' : '') + '</small>', taux !== null ? taux + ' % des ' + R.logements + ' logements' : '') +
      cle('Satisfaction globale', glob !== null ? anneau(glob) : '—', 'part des avis « plutôt bien » ou « très bien »') +
      cle('Priorité n° 1 des résidents', prio ? esc(theme(prio[0]).titre) : '—', prio ? prio[1] + ' foyer' + (prio[1] > 1 ? 's' : '') + ' la placent en premier' : '', 'texte') +
      cle('Point le plus apprécié', meilleur ? esc(meilleur.t.titre) : '—', meilleur ? meilleur.p + ' % de satisfaits' : '', 'texte') +
      '</section>';

    // En bref
    const bref = [];
    bref.push(R.total + (R.total > 1 ? ' foyers ont donné leur avis' : ' foyer a donné son avis') + (taux !== null ? ', soit ' + taux + ' % des logements' : '') + '.');
    if (pire) bref.push('La première préoccupation porte sur « ' + pire.t.titre + ' » (' + pire.p + ' % de satisfaits).');
    if (meilleur && meilleur !== pire) bref.push('Le point le mieux perçu est « ' + meilleur.t.titre + ' » (' + meilleur.p + ' % de satisfaits).');
    h += '<section class="rp-bloc"><h2>En bref</h2><p class="rp-bref">' + esc(bref.join(' ')) + '</p>' +
      (R.intro ? '<p class="rp-intro">' + esc(R.intro).replace(/\n/g, '<br>') + '</p>' : '') + '</section>';

    // Ce qui fonctionne et ce qui progresse
    const forts = notes.filter(x => x.p >= 50).reverse();
    const ameli = trie(R.ameliorations).filter(([k]) => k !== 'aucun');
    h += '<section class="rp-bloc"><h2>Ce qui fonctionne et ce qui progresse</h2><div class="rp-deux">' +
      '<div><h3>Points appréciés</h3>' + (forts.length ? '<ul class="rp-liste-ok">' + forts.map(x => '<li>' + icone('valider') + '<span><strong>' + esc(x.t.titre) + '</strong> · ' + x.p + ' % de satisfaits</span></li>').join('') + '</ul>'
        : '<p class="rp-discret">Aucun thème ne recueille encore une majorité d’avis favorables.</p>') + '</div>' +
      '<div><h3>Améliorations constatées par les résidents</h3>' + (ameli.length ? barres(ameli.map(([k, n]) => [theme(k).titre, n]))
        : '<p class="rp-discret">Aucune amélioration signalée sur la période.</p>') + '</div></div></section>';

    // Satisfaction par thème (interactif)
    const bats = (R.batiments || []).filter(b => R.detailBatiments && R.detailBatiments.indexOf(b.id) >= 0);
    h += '<section class="rp-bloc"><h2>Satisfaction par thème</h2><p class="rp-sous">Du thème le plus préoccupant au plus satisfaisant. Touchez un thème pour le détail.</p>' +
      (bats.length ? '<div class="rp-puces ecran-seul" role="group" aria-label="Bâtiment">' +
        [{ id: 'tous', libelle: 'Toute la résidence' }].concat(bats.map(b => ({ id: b.id, libelle: b.libelle + ' ' + b.rue }))).map(b =>
          '<button type="button" class="rp-puce" data-bat="' + b.id + '" aria-pressed="' + (filtre === b.id) + '">' + esc(b.libelle) + '</button>').join('') + '</div>' : '') +
      '<div id="rp-themes" class="rp-themes"></div>' +
      '<div class="rp-legende">' + NIVEAUX.map(n => '<span><i class="s' + n.v + '"></i>' + n.lib + '</span>').join('') + '</div>' +
      (R.seuilBatiment ? '<p class="rp-discret">Le détail par bâtiment n’est affiché qu’à partir de ' + R.seuilBatiment + ' réponses, pour préserver l’anonymat.</p>' : '') + '</section>';

    // Évolution
    if (R.precedent && R.precedent.themes) {
      const lignes = R.themesDef.map(t => ({ t, avant: R.precedent.themes[t.id], apres: pctSatisf(distDe(t.id, 'tous')) }))
        .filter(x => x.avant != null && x.apres != null);
      if (lignes.length) h += '<section class="rp-bloc"><h2>Évolution depuis ' + esc(R.precedent.libelle) + '</h2><div class="rp-table-zone"><table class="rp-table"><thead><tr><th>Thème</th><th>' + esc(R.precedent.libelle) + '</th><th>' + esc(R.periodeLibelle) + '</th><th></th></tr></thead><tbody>' +
        lignes.map(x => { const e = x.apres - x.avant;
          return '<tr><td>' + esc(x.t.titre) + '</td><td>' + x.avant + ' %</td><td><strong>' + x.apres + ' %</strong></td><td class="' + (e > 0 ? 'rp-hausse' : e < 0 ? 'rp-baisse' : '') + '">' + (e > 0 ? '▲ +' + e : e < 0 ? '▼ ' + e : '=') + '</td></tr>'; }).join('') +
        '</tbody></table></div></section>';
    }

    // Priorités
    const prios = trie(R.priorites);
    h += '<section class="rp-bloc"><h2>Priorités des résidents</h2><p class="rp-sous">« Si une seule chose devait être réglée en premier ». Un choix par foyer.</p>' +
      (prios.length ? barres(prios.map(([k, n]) => [theme(k).titre, n])) : '<p class="rp-discret">Pas de priorité exprimée.</p>') + '</section>';

    // Demandes
    if (R.demandes && R.demandes.length) {
      h += '<section class="rp-bloc"><h2>Demandes des résidents</h2><ol class="rp-demandes">' +
        R.demandes.map(d => { const t = theme(d.theme);
          return '<li><div class="rp-demande-ic">' + icone(t.icone) + '</div><div><strong>' + esc(t.titre) + '</strong><p>' + esc(d.texte) + '</p></div></li>'; }).join('') + '</ol></section>';
    }

    // Méthode
    h += '<section class="rp-bloc rp-methode"><h2>Méthode</h2><p>Questionnaire en ligne, anonyme, proposé à l’ensemble des résidents. Aucune information personnelle n’est demandée : ni nom, ni adresse, ni bâtiment. ' +
      'Un avis par téléphone, modifiable tant que la consultation est ouverte. Les questions portent uniquement sur la vie collective de la résidence, jamais sur des situations individuelles. ' +
      'Pour chaque thème, la satisfaction correspond à la part des réponses « plutôt bien » et « très bien ».</p></section>';

    // Réponse aux résidents
    h += '<section class="rp-bloc rp-repondre ecran-seul" id="repondre"><h2>Répondre aux résidents</h2>' +
      '<p class="rp-sous">Votre message est transmis directement aux résidents qui ont préparé ce compte rendu.</p>' +
      '<form id="form-reponse" novalidate><div class="rp-champs"><label>Nom et service <span>(facultatif)</span><input name="nom" maxlength="120" autocomplete="organization"></label>' +
      '<label>Adresse pour vous répondre <span>(facultatif)</span><input name="contact" maxlength="160" type="email" autocomplete="email"></label></div>' +
      '<label>Message<textarea name="message" rows="6" maxlength="4000" required></textarea></label>' +
      '<div id="reponse-etat" role="status"></div>' +
      '<button class="btn btn-principal" type="submit">' + icone('valider') + 'Envoyer le message</button></form></section>';

    // Signature
    h += '<footer class="rp-signature"><p>' + esc(R.signature) + '</p><small>' + esc(R.adresses || '') + '</small>' +
      '<div class="ecran-seul rp-actions"><button class="btn btn-secondaire" type="button" id="btn-imprimer">' + icone('telecharger') + 'Enregistrer en PDF</button></div></footer>';

    $r.innerHTML = h;
    rendreThemes();
    brancher();
  }

  function rendreThemes() {
    const zone = document.getElementById('rp-themes');
    zone.innerHTML = classement(filtre).map(x => {
      const ouvre = ouvert === x.t.id;
      let ligne = '<div class="rp-theme' + (ouvre ? ' ouvert' : '') + '"><button type="button" class="rp-theme-tete" data-theme="' + x.t.id + '" aria-expanded="' + ouvre + '">' +
        '<span class="rp-theme-ic">' + icone(x.t.icone) + '</span><span class="rp-theme-titre">' + esc(x.t.titre) + '</span>' +
        '<span class="rp-empile">' + (x.n ? NIVEAUX.map(n => '<i class="s' + n.v + '" style="width:' + ((x.d[n.v] || 0) / x.n * 100) + '%"></i>').join('') : '') + '</span>' +
        '<span class="rp-theme-score">' + (x.n ? '<strong>' + x.p + ' %</strong> satisfaits' : 'Pas de réponse') + '</span></button>';
      if (ouvre) ligne += detailTheme(x);
      return ligne + '</div>';
    }).join('');
    zone.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => {
      ouvert = ouvert === b.dataset.theme ? null : b.dataset.theme;
      rendreThemes();
    }));
  }

  function detailTheme(x) {
    let h = '<div class="rp-detail">' + (x.t.detail ? '<p class="rp-discret">' + esc(x.t.detail) + '</p>' : '');
    if (x.n) h += '<div class="rp-repartition">' + NIVEAUX.map(n => '<div><span class="rp-pastille s' + n.v + '"></span>' + n.lib + '<strong>' + (x.d[n.v] || 0) + '</strong></div>').join('') + '</div>';
    const parBat = (R.batiments || []).filter(b => R.detailBatiments && R.detailBatiments.indexOf(b.id) >= 0)
      .map(b => ({ b, p: pctSatisf(distDe(x.t.id, b.id)) })).filter(y => y.p !== null);
    if (filtre === 'tous' && parBat.length) h += '<h4>Par bâtiment</h4>' + barres(parBat.map(y => [y.b.libelle + ' ' + y.b.rue, y.p]), '%');
    const dem = (R.demandes || []).find(d => d.theme === x.t.id);
    if (dem) h += '<div class="rp-demande-encart"><strong>Demande des résidents</strong><p>' + esc(dem.texte) + '</p></div>';
    return h + '</div>';
  }

  function cle(titre, valeur, legende, type) {
    return '<div class="rp-cle' + (type ? ' ' + type : '') + '"><span class="rp-cle-titre">' + esc(titre) + '</span><div class="rp-cle-valeur">' + valeur + '</div>' +
      (legende ? '<span class="rp-cle-legende">' + esc(legende) + '</span>' : '') + '</div>';
  }

  function anneau(p) {
    const r = 26, c = 2 * Math.PI * r;
    return '<span class="rp-anneau"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="' + r + '" class="rp-anneau-fond"/>' +
      '<circle cx="32" cy="32" r="' + r + '" class="rp-anneau-val" stroke-dasharray="' + (c * p / 100) + ' ' + c + '"/></svg><b>' + p + ' %</b></span>';
  }

  function barres(liste, unite) {
    const max = unite === '%' ? 100 : Math.max(1, ...liste.map(x => x[1]));
    return '<div class="rp-barres">' + liste.map(([lib, n]) => '<div class="rp-barre"><span>' + esc(lib) + '</span><div class="rp-barre-piste"><div style="width:' + (n / max * 100) + '%"></div></div><b>' + n + (unite || '') + '</b></div>').join('') + '</div>';
  }

  function qrSvg(texte) {
    if (!window.qrcode) return '';
    const q = window.qrcode(0, 'M');
    q.addData(texte);
    q.make();
    return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
  }

  function brancher() {
    $r.querySelectorAll('[data-bat]').forEach(b => b.addEventListener('click', () => {
      filtre = b.dataset.bat;
      $r.querySelectorAll('[data-bat]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      rendreThemes();
    }));
    document.getElementById('btn-imprimer').addEventListener('click', () => window.print());
    document.getElementById('form-reponse').addEventListener('submit', envoyerReponse);
  }

  async function envoyerReponse(e) {
    e.preventDefault();
    const f = e.target;
    const etat = document.getElementById('reponse-etat');
    const bouton = f.querySelector('button[type="submit"]');
    const message = f.message.value.trim();
    etat.className = '';
    etat.textContent = '';
    if (!message) { etat.className = 'rp-erreur'; etat.textContent = 'Écrivez votre message avant de l’envoyer.'; f.message.focus(); return; }
    bouton.disabled = true;
    bouton.textContent = 'Envoi…';
    try {
      await db.collection('reponses').add({
        rapport: id, nom: f.nom.value.trim().slice(0, 120), contact: f.contact.value.trim().slice(0, 160),
        message: message.slice(0, 4000), envoyeLe: firebase.firestore.FieldValue.serverTimestamp()
      });
      f.outerHTML = '<div class="rp-merci">' + icone('valider') + '<div><strong>Message envoyé.</strong><p>Merci : les résidents l’ont bien reçu.</p></div></div>';
    } catch (err) {
      etat.className = 'rp-erreur';
      etat.textContent = 'L’envoi n’a pas abouti. Vérifiez votre connexion et réessayez : votre message est conservé.';
      bouton.disabled = false;
      bouton.innerHTML = icone('valider') + 'Envoyer le message';
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
