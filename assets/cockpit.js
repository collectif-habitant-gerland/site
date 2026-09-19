// Cockpit du pilote : connexion Google du collectif, lecture en direct des avis, exports.
(function () {
  const C = window.VOIX_CONFIG;
  const { icone } = window.VoixIcons;
  const ADMIN = 'collectif.habitant.erilia@gmail.com';

  firebase.initializeApp(window.VOIX_FIREBASE);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const $app = document.getElementById('app');
  const $compte = document.getElementById('compte');
  document.getElementById('logo').innerHTML = icone('ecoute');

  let tous = [];                 // tous les avis, toutes périodes
  let periode = C.periode.id;
  let filtreBat = 'tous';
  let arret = null;              // arrêt de l'écoute en direct

  // ---------- Connexion ----------
  auth.onAuthStateChanged(u => {
    if (arret) { arret(); arret = null; }
    if (!u || u.isAnonymous) { $compte.innerHTML = ''; return ecranConnexion(); }
    $compte.innerHTML = '<span>' + esc(u.email || '') + '</span><button class="ck-btn" id="btn-sortir" type="button">' + icone('sortir') + 'Se déconnecter</button>';
    document.getElementById('btn-sortir').addEventListener('click', () => auth.signOut());
    if (u.email !== ADMIN) return ecranRefuse(u.email);
    $app.innerHTML = '<div class="ck-vide">Chargement des avis…</div>';
    arret = db.collection('avis').onSnapshot(snap => {
      tous = snap.docs.map(d => Object.assign({ id: d.id }, d.data({ serverTimestamps: 'estimate' })));
      rendre();
    }, err => {
      $app.innerHTML = '<div class="ck-connexion"><h1>Lecture impossible</h1><p>Firebase a refusé la lecture (' + esc(err.code || err.message) + ').</p></div>';
    });
  });

  function ecranConnexion(message) {
    $app.innerHTML = '<div class="ck-connexion"><div class="intro-ic">' + icone('cadenas') + '</div>' +
      '<h1>Cockpit du pilote</h1><p>Connectez-vous avec le compte Google du collectif pour voir les avis des résidents.</p>' +
      '<button class="ck-btn principal ck-google" id="btn-google" type="button">Se connecter avec Google</button>' +
      '<div class="ck-message" id="msg">' + esc(message || '') + '</div></div>';
    document.getElementById('btn-google').addEventListener('click', async () => {
      const fournisseur = new firebase.auth.GoogleAuthProvider();
      fournisseur.setCustomParameters({ prompt: 'select_account' });
      try { await auth.signInWithPopup(fournisseur); } catch (e) {
        if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
          document.getElementById('msg').textContent = 'Connexion impossible (' + (e.code || e.message) + ').';
        }
      }
    });
  }

  function ecranRefuse(email) {
    $app.innerHTML = '<div class="ck-connexion"><div class="intro-ic" style="background:var(--alerte)">' + icone('cadenas') + '</div>' +
      '<h1>Accès réservé</h1><p>Le compte ' + esc(email || '') + ' n’a pas accès au cockpit. Déconnectez-vous puis choisissez le compte du collectif.</p></div>';
  }

  // ---------- Calculs ----------
  function libellePeriode(id) {
    const m = /^(\d{4})-(\d{2})$/.exec(id);
    if (!m) return id;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
    const txt = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return Number(m[1]) < 2020 ? txt + ' (test)' : txt;
  }
  const dateDe = a => (a.envoyeLe && a.envoyeLe.toDate) ? a.envoyeLe.toDate() : null;
  const titreTheme = id => (C.themes.find(t => t.id === id) || {}).titre || id;

  function statsTheme(liste, id) {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0 };
    liste.forEach(a => { const v = a.notes && a.notes[id]; if (dist[v] !== undefined) dist[v]++; });
    const n = dist[1] + dist[2] + dist[3] + dist[4];
    return { dist, n, satisfaits: n ? Math.round((dist[3] + dist[4]) / n * 100) : null };
  }
  function compter(liste, cle) {
    const c = {};
    liste.forEach(a => [].concat(a[cle] || []).forEach(v => { if (v) c[v] = (c[v] || 0) + 1; }));
    return Object.entries(c).sort((x, y) => y[1] - x[1]);
  }

  // ---------- Affichage ----------
  function rendre() {
    const periodes = Array.from(new Set(tous.map(a => a.periode).concat(C.periode.id))).sort().reverse();
    const avisP = tous.filter(a => a.periode === periode);
    const avisF = filtreBat === 'tous' ? avisP : avisP.filter(a => a.batiment === filtreBat);

    let h = '<div class="ck-outils"><h1>Avis des résidents</h1>' +
      '<select class="ck-select" id="sel-periode" aria-label="Période">' +
      periodes.map(p => '<option value="' + p + '"' + (p === periode ? ' selected' : '') + '>' + esc(libellePeriode(p)) + '</option>').join('') +
      '</select><div class="ck-puces" role="group" aria-label="Bâtiment">' +
      [['tous', 'Tous']].concat(C.batiments.map(b => [b.id, b.libelle])).map(([id, lib]) =>
        '<button class="ck-puce" type="button" data-bat="' + id + '" aria-pressed="' + (filtreBat === id) + '">' + esc(lib) + '</button>').join('') +
      '</div></div><div class="ck-grille">';

    // Participation
    const taux = C.logements ? Math.round(avisP.length / C.logements * 100) : null;
    h += '<section class="ck-carte tiers"><h2>Participation</h2><p class="ck-sous">' + esc(libellePeriode(periode)) + ', tous bâtiments</p>' +
      '<div class="ck-chiffre">' + avisP.length + ' <small>foyer' + (avisP.length > 1 ? 's' : '') + (C.logements ? ' sur ' + C.logements + ' logements' : '') + '</small></div>' +
      (taux !== null ? '<div class="ck-jauge"><div style="width:' + Math.min(taux, 100) + '%"></div></div><p class="ck-note">' + taux + ' % des logements</p>' : '') + '</section>';

    // Par bâtiment
    const maxBat = Math.max(1, ...C.batiments.map(b => avisP.filter(a => a.batiment === b.id).length));
    h += '<section class="ck-carte tiers"><h2>Par bâtiment</h2><p class="ck-sous">Nombre de foyers ayant répondu</p><div class="ck-barres">' +
      C.batiments.map(b => { const n = avisP.filter(a => a.batiment === b.id).length;
        return barre(b.libelle + ' ' + b.rue.replace('avenue', 'av.'), n, maxBat); }).join('') + '</div></section>';

    // Par jour
    const jours = {};
    avisP.forEach(a => { const d = dateDe(a); if (d) { const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); jours[k] = (jours[k] || 0) + 1; } });
    const cles = Object.keys(jours).sort();
    const maxJ = Math.max(1, ...Object.values(jours));
    h += '<section class="ck-carte tiers"><h2>Réponses par jour</h2><p class="ck-sous">Pour voir l’effet d’une relance</p>' +
      (cles.length ? '<div class="ck-jours">' + cles.map(k => '<div class="ck-jour" title="' + jours[k] + ' réponse(s)"><div class="ck-jour-col" style="height:' + Math.round(jours[k] / maxJ * 90) + '%"></div><span>' + k.slice(8) + '/' + k.slice(5, 7) + '</span></div>').join('') + '</div>'
        : '<div class="ck-vide">Pas encore de réponse</div>') + '</section>';

    // Satisfaction par thème
    const stats = C.themes.map(t => Object.assign({ t }, statsTheme(avisF, t.id)))
      .sort((a, b) => (a.satisfaits === null) - (b.satisfaits === null) || (a.satisfaits - b.satisfaits));
    h += '<section class="ck-carte"><h2>Satisfaction par thème</h2><p class="ck-sous">Du plus préoccupant au plus satisfaisant' +
      (filtreBat !== 'tous' ? ' · bâtiment ' + esc(filtreBat) : '') + ' · ' + avisF.length + ' avis</p><div class="ck-themes">' +
      stats.map(s => '<div class="ck-theme"><div class="ck-theme-ic">' + icone(s.t.icone) + '</div>' +
        '<div class="ck-theme-titre">' + esc(s.t.titre) + '</div>' +
        '<div class="ck-empile" title="Très mal ' + s.dist[1] + ' · Plutôt mal ' + s.dist[2] + ' · Plutôt bien ' + s.dist[3] + ' · Très bien ' + s.dist[4] + '">' +
        [1, 2, 3, 4].map(v => s.n ? '<div class="s' + v + '" style="width:' + (s.dist[v] / s.n * 100) + '%"></div>' : '').join('') + '</div>' +
        '<div class="ck-theme-score">' + (s.n ? '<strong>' + s.satisfaits + ' % satisfaits</strong>' + s.n + ' réponse' + (s.n > 1 ? 's' : '') : 'Aucune réponse') + '</div></div>').join('') +
      '</div><div class="ck-legende">' + C.echelle.map(e => '<span><i style="background:var(--v' + e.valeur + ')"></i>' + esc(e.libelle) + '</span>').join('') + '</div></section>';

    // Améliorations et priorités
    const am = compter(avisF, 'ameliorations');
    const maxAm = Math.max(1, ...am.map(x => x[1]));
    h += '<section class="ck-carte demi"><h2>Ce qui s’est amélioré</h2><p class="ck-sous">Plusieurs choix possibles par foyer</p>' +
      (am.length ? '<div class="ck-barres">' + am.map(([id, n]) => barre(id === 'aucun' ? 'Rien de particulier' : titreTheme(id), n, maxAm)).join('') + '</div>'
        : '<div class="ck-vide">Pas encore de réponse</div>') + '</section>';
    const pr = compter(avisF, 'priorite');
    const maxPr = Math.max(1, ...pr.map(x => x[1]));
    h += '<section class="ck-carte demi"><h2>Priorité n° 1</h2><p class="ck-sous">Un seul choix par foyer</p>' +
      (pr.length ? '<div class="ck-barres">' + pr.map(([id, n]) => barre(titreTheme(id), n, maxPr)).join('') + '</div>'
        : '<div class="ck-vide">Pas encore de réponse</div>') + '</section>';

    // Liste des avis
    const tries = avisF.slice().sort((a, b) => (dateDe(b) || 0) - (dateDe(a) || 0));
    h += '<section class="ck-carte"><h2>Liste des avis</h2><p class="ck-sous">Anonymes : seulement la date et le bâtiment</p>' +
      (tries.length ? '<div class="ck-table-zone"><table class="ck-table"><thead><tr><th>Envoyé le</th><th>Bâtiment</th><th>Thèmes notés</th><th>Priorité n° 1</th><th></th></tr></thead><tbody>' +
        tries.map(a => { const d = dateDe(a);
          return '<tr><td>' + (d ? d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—') + '</td>' +
            '<td>' + esc(a.batiment || '') + '</td><td>' + Object.keys(a.notes || {}).length + ' / ' + C.themes.length + '</td>' +
            '<td>' + esc(a.priorite ? titreTheme(a.priorite) : '—') + '</td>' +
            '<td style="text-align:right"><button class="ck-btn danger" type="button" data-suppr="' + esc(a.id) + '">Supprimer</button></td></tr>'; }).join('') +
        '</tbody></table></div>' : '<div class="ck-vide">Aucun avis pour cette période</div>') + '</section>';

    // Sauvegarde
    h += '<section class="ck-carte"><h2>Sauvegarder sur mon ordinateur</h2><p class="ck-sous">Une copie des avis dans le dossier Téléchargements</p>' +
      '<div class="ck-actions-bas"><button class="ck-btn principal" type="button" id="btn-csv">' + icone('telecharger') + 'Tableau Excel (' + esc(libellePeriode(periode)) + ')</button>' +
      '<button class="ck-btn" type="button" id="btn-json">' + icone('telecharger') + 'Copie complète (toutes périodes)</button></div>' +
      '<p class="ck-note">Le compte rendu pour le bailleur (PDF et version en ligne) arrivera ici au prochain lot.</p></section>';

    h += '</div>';
    $app.innerHTML = h;
    brancher();
  }

  function barre(libelle, n, max) {
    return '<div class="ck-barre"><span>' + esc(libelle) + '</span><div class="ck-barre-piste"><div style="width:' + (n / max * 100) + '%"></div></div><span class="ck-barre-nb">' + n + '</span></div>';
  }

  function brancher() {
    document.getElementById('sel-periode').addEventListener('change', e => { periode = e.target.value; rendre(); });
    $app.querySelectorAll('[data-bat]').forEach(b => b.addEventListener('click', () => { filtreBat = b.dataset.bat; rendre(); }));
    $app.querySelectorAll('[data-suppr]').forEach(b => b.addEventListener('click', () => supprimer(b.dataset.suppr)));
    document.getElementById('btn-csv').addEventListener('click', exporterCsv);
    document.getElementById('btn-json').addEventListener('click', exporterJson);
  }

  // ---------- Suppression ----------
  async function supprimer(id) {
    const a = tous.find(x => x.id === id);
    if (!a) return;
    const ok = await confirmer({ titre: 'Supprimer cet avis ?', texte: 'L’avis du bâtiment ' + (a.batiment || '') + ' sera définitivement effacé, et le compteur de participation diminué de 1.', oui: 'Supprimer', non: 'Annuler' });
    if (!ok) return;
    try {
      const refC = db.collection('compteurs').doc(a.periode);
      await db.runTransaction(async tx => {
        const c = await tx.get(refC);
        tx.delete(db.collection('avis').doc(id));
        if (c.exists) tx.update(refC, { total: Math.max(0, (c.data().total || 0) - 1) });
      });
    } catch (e) {
      alert('Suppression impossible (' + (e.code || e.message) + ').');
    }
  }

  // ---------- Exports ----------
  function telecharger(nom, contenu, type) {
    const url = URL.createObjectURL(new Blob([contenu], { type }));
    const lien = document.createElement('a');
    lien.href = url; lien.download = nom;
    document.body.appendChild(lien); lien.click(); lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  const aujourdhui = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const cellule = v => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

  function exporterCsv() {
    const liste = tous.filter(a => a.periode === periode).sort((a, b) => (dateDe(a) || 0) - (dateDe(b) || 0));
    const entete = ['Envoyé le', 'Période', 'Bâtiment'].concat(C.themes.map(t => t.titre + ' (1 à 4)'), ['Ce qui s’est amélioré', 'Priorité n° 1']);
    const lignes = liste.map(a => { const d = dateDe(a);
      return [d ? d.toLocaleString('fr-FR') : '', a.periode, a.batiment]
        .concat(C.themes.map(t => (a.notes || {})[t.id] || ''),
          [(a.ameliorations || []).map(x => x === 'aucun' ? 'Rien de particulier' : titreTheme(x)).join(', '), a.priorite ? titreTheme(a.priorite) : '']); });
    const csv = '﻿' + [entete].concat(lignes).map(l => l.map(cellule).join(';')).join('\r\n');
    telecharger('voix-habitants_' + periode + '_' + aujourdhui() + '.csv', csv, 'text/csv;charset=utf-8');
  }

  function exporterJson() {
    const copie = tous.map(a => { const d = dateDe(a);
      return { periode: a.periode, batiment: a.batiment, notes: a.notes || {}, ameliorations: a.ameliorations || [], priorite: a.priorite || null, envoyeLe: d ? d.toISOString() : null }; });
    telecharger('voix-habitants_copie-complete_' + aujourdhui() + '.json',
      JSON.stringify({ exporteLe: new Date().toISOString(), residence: C.residence, avis: copie }, null, 2), 'application/json');
  }

  // ---------- Fenêtre de confirmation ----------
  function confirmer(o) {
    return new Promise(resolve => {
      const voile = document.createElement('div');
      voile.className = 'voile';
      voile.innerHTML = '<div class="dialogue" role="alertdialog" aria-modal="true" aria-labelledby="d-titre">' +
        '<h3 id="d-titre">' + esc(o.titre) + '</h3><p>' + esc(o.texte) + '</p>' +
        '<div class="actions" style="margin-top:0"><button type="button" class="btn btn-principal" data-r="non">' + esc(o.non) + '</button>' +
        '<button type="button" class="btn btn-secondaire" data-r="oui" style="color:var(--alerte)">' + esc(o.oui) + '</button></div></div>';
      const fermer = r => { voile.remove(); document.removeEventListener('keydown', clavier); resolve(r); };
      const clavier = e => { if (e.key === 'Escape') fermer(false); };
      voile.addEventListener('click', e => {
        if (e.target === voile) fermer(false);
        const b = e.target.closest('[data-r]');
        if (b) fermer(b.dataset.r === 'oui');
      });
      document.addEventListener('keydown', clavier);
      document.body.appendChild(voile);
      voile.querySelector('[data-r="non"]').focus();
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
