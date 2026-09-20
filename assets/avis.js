// Baromètre : une question par écran, avancée automatique, retour arrière, récapitulatif, envoi.
(function () {
  const C = window.VOIX_CONFIG;
  const S = window.VoixStore;
  const { icone, visage } = window.VoixIcons;
  let PERIODE = C.periode.id;                         // remplacée au démarrage par la période ouverte dans le cockpit
  let CLE_BROUILLON = 'voix.brouillon.' + PERIODE;
  const DELAI_AVANCE = 400;

  // ---------- Étapes ----------
  const etapes = [{ id: 'intro', type: 'intro' }]
    .concat(C.themes.map(t => ({ id: t.id, type: 'note', theme: t })))
    .concat([{ id: 'ameliorations', type: 'ameliorations' }, { id: 'priorite', type: 'priorite' }, { id: 'recap', type: 'recap' }]);
  const questions = etapes.filter(e => e.type !== 'intro' && e.type !== 'recap');
  const indexDe = id => etapes.findIndex(e => e.id === id);

  // ---------- État ----------
  let rep = brouillonVide();
  let courant = 0;
  let depuisRecap = false;   // une question ouverte depuis le récapitulatif y revient après réponse
  let envoye = false;
  let envoiEnCours = false;
  let minuteur = null;
  let pret = false;          // état du serveur connu (avis déjà envoyé ou non)
  let fermee = null;         // 'pause' ou 'close' quand le pilote a arrêté les réponses
  let dejaEnvoye = null;     // avis déjà envoyé depuis ce téléphone pour la période

  function brouillonVide() { return { notes: {}, ameliorations: [], priorite: null, derniere: 'intro' }; }
  function aDesReponses() {
    return !!(Object.keys(rep.notes).length || rep.ameliorations.length || rep.priorite);
  }
  function sauver() {
    try { localStorage.setItem(CLE_BROUILLON, JSON.stringify(rep)); } catch (e) { /* stockage indisponible */ }
  }
  function charger() {
    try { const b = JSON.parse(localStorage.getItem(CLE_BROUILLON)); if (b && b.notes) return b; } catch (e) { /* ignoré */ }
    return null;
  }
  function effacerBrouillon() { try { localStorage.removeItem(CLE_BROUILLON); } catch (e) { /* ignoré */ } }

  // ---------- Éléments fixes ----------
  const $ecran = document.getElementById('ecran');
  const $retour = document.getElementById('btn-retour');
  const $fermer = document.getElementById('btn-fermer');
  const $progTexte = document.getElementById('progression-texte');
  const $progJauge = document.getElementById('progression-jauge');
  $retour.innerHTML = icone('retour');
  $fermer.innerHTML = icone('fermer');
  if (S.mode === 'test') { document.getElementById('mode-test').hidden = false; document.body.classList.add('en-test'); }

  // ---------- Navigation (flèche ←, bouton Précédent du téléphone, glissement iPhone) ----------
  function aller(index) {
    clearTimeout(minuteur);
    history.pushState({ etape: index }, '', '#' + etapes[index].id);
    afficher(index, 'avant');
  }
  function suivant() {
    if (depuisRecap) { history.back(); return; }   // retour direct au récapitulatif
    aller(courant + 1);
  }
  $retour.addEventListener('click', () => { clearTimeout(minuteur); history.back(); });
  window.addEventListener('popstate', e => {
    clearTimeout(minuteur);
    if (envoye) { location.replace('index.html'); return; }
    const index = e.state && typeof e.state.etape === 'number' ? e.state.etape : 0;
    afficher(index, index < courant ? 'arriere' : 'avant');
  });

  // Croix : quitter, avec confirmation si des réponses ne sont pas envoyées.
  $fermer.addEventListener('click', () => {
    clearTimeout(minuteur);
    if (envoye || !aDesReponses()) { location.href = 'index.html'; return; }
    confirmer({
      titre: 'Quitter le questionnaire ?',
      texte: 'Vos réponses ne sont pas encore envoyées. Elles restent gardées sur ce téléphone : vous pourrez reprendre plus tard.',
      oui: 'Quitter', non: 'Continuer'
    }).then(ok => { if (ok) location.href = 'index.html'; });
  });

  // ---------- Affichage ----------
  function afficher(index, sens) {
    courant = Math.max(0, Math.min(index, etapes.length - 1));
    const etape = etapes[courant];
    if (etape.type === 'recap') depuisRecap = false;
    rep.derniere = etape.id;
    if (aDesReponses()) sauver();

    // Barre du haut
    const q = questions.indexOf(etape);
    $retour.hidden = courant === 0;
    if (q >= 0) {
      $progTexte.textContent = (q + 1) + ' / ' + questions.length;
      $progJauge.style.width = ((q + 1) / questions.length * 100) + '%';
    } else if (etape.type === 'recap') {
      $progTexte.textContent = 'Vérification';
      $progJauge.style.width = '100%';
    } else {
      $progTexte.textContent = '';
      $progJauge.style.width = '0';
    }
    document.getElementById('progression').style.visibility = etape.type === 'intro' ? 'hidden' : '';

    const rendus = { intro: rendreIntro, note: rendreNote, ameliorations: rendreAmeliorations, priorite: rendrePriorite, recap: rendreRecap };
    $ecran.innerHTML = rendus[etape.type](etape);
    $ecran.className = 'ecran entre-' + sens;
    brancher(etape);
    window.scrollTo(0, 0);
    const titre = $ecran.querySelector('h2');
    if (titre && sens) { titre.setAttribute('tabindex', '-1'); titre.focus({ preventScroll: true }); }
  }

  function enTete(ic, surtitre, titre, detail) {
    return '<div class="question">' +
      '<div class="question-theme">' + icone(ic) + esc(surtitre) + '</div>' +
      '<h2>' + esc(titre) + '</h2>' + (detail ? '<p class="detail">' + esc(detail) + '</p>' : '');
  }

  function rendreIntro() {
    const deja = dejaEnvoye;
    const brouillon = aDesReponses();
    let actions;
    if (!S.aUnCode()) {
      actions = '<form class="code-acces" id="form-code" novalidate>' +
        '<label for="champ-code">Code des résidents</label>' +
        '<input id="champ-code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Votre code" required>' +
        '<p class="code-aide">Il se trouve dans le groupe WhatsApp des résidents et sur l’affiche du hall.</p>' +
        '<div id="code-erreur" class="code-erreur" role="alert"></div>' +
        '<button type="submit" class="btn btn-principal">' + icone('cadenas') + 'Valider le code</button></form>';
    } else if (pret && fermee) {
      const titre = fermee === 'pause' ? 'Les réponses sont en pause' : 'Cette consultation est terminée';
      const texte = fermee === 'pause'
        ? 'Le questionnaire est momentanément fermé. Il rouvrira bientôt : l’annonce sera faite dans le groupe des résidents.'
        : 'Merci à tous ceux qui ont participé ! Les réponses sont en cours de transmission au bailleur. Une nouvelle consultation sera annoncée dans le groupe des résidents.';
      return '<div class="question"><div class="intro-ic">' + icone(fermee === 'pause' ? 'horloge' : 'coeur') + '</div>' +
        '<h2>' + titre + '</h2><p class="detail">' + texte + '</p>' +
        '<div class="actions"><a class="btn btn-principal" href="index.html">Retour à l’accueil</a></div></div>';
    } else if (!pret) {
      actions = '<div class="actions"><button class="btn btn-principal" disabled>Chargement…</button></div>';
    } else if (deja && !brouillon) {
      actions = '<div class="alerte" style="background:var(--vert-pale);color:var(--vert-fonce)">' + icone('valider') +
        '<span>Vous avez déjà donné votre avis pour ' + esc(C.periode.libelle) + '. Merci ! Vous pouvez encore le modifier jusqu’à la fin de la période.</span></div>' +
        '<div class="actions"><button class="btn btn-principal" data-action="modifier">' + icone('modifier') + 'Modifier mes réponses</button>' +
        '<a class="btn btn-secondaire" href="index.html">Retour à l’accueil</a></div>';
    } else if (brouillon) {
      actions = '<div class="actions"><button class="btn btn-principal" data-action="reprendre">Reprendre là où j’en étais' + icone('suivant') + '</button>' +
        '<button class="btn btn-discret" data-action="recommencer">Tout recommencer</button></div>';
    } else {
      actions = '<div class="actions"><button class="btn btn-principal" data-action="commencer">Commencer' + icone('suivant') + '</button></div>';
    }
    return '<div class="question"><div class="intro-ic">' + icone('avis') + '</div>' +
      '<h2>Comment ça se passe dans la résidence ?</h2>' +
      '<p class="detail">Quelques touches, question après question. Vous pouvez revenir en arrière à tout moment.</p>' +
      '<ul class="points">' +
      '<li>' + icone('horloge') + 'Environ 2 minutes, sans rien écrire</li>' +
      '<li>' + icone('cadenas') + 'Anonyme : aucune information personnelle</li>' +
      '<li>' + icone('groupe') + 'Uniquement la vie collective de la résidence</li>' +
      '</ul>' + actions + '</div>';
  }

  function rendreNote(etape) {
    const t = etape.theme;
    const choisi = rep.notes[t.id];
    return enTete(t.icone, 'En ce moment, comment ça se passe ?', t.titre, t.detail) +
      '<div class="echelle" role="group" aria-label="Votre avis">' + C.echelle.map(e =>
        '<button type="button" class="choix-visage c' + e.valeur + '" data-note="' + e.valeur + '" aria-pressed="' + (choisi === e.valeur) + '">' +
        visage(e.valeur) + '<span>' + esc(e.libelle) + '</span></button>').join('') +
      '</div>' + boutonsBas({ passer: true }) + '</div>';
  }

  function rendreAmeliorations() {
    const aucun = rep.ameliorations.indexOf('aucun') >= 0;
    return enTete('ameliore', 'Ce qui va mieux', 'Qu’est-ce qui s’est amélioré ces derniers mois ?', 'Plusieurs choix possibles. Ce qui progresse compte aussi.') +
      '<div class="liste-choix">' + C.themes.map(t => ligneChoix('amelioration', t.id, t.icone, t.titre, rep.ameliorations.indexOf(t.id) >= 0)).join('') +
      ligneChoix('amelioration', 'aucun', 'fermer', 'Rien de particulier', aucun) +
      '</div><div class="actions"><button type="button" class="btn btn-principal" data-action="continuer">Continuer' + icone('suivant') + '</button></div></div>';
  }

  function rendrePriorite() {
    return enTete('priorite', 'Votre priorité', 'Si une seule chose devait être réglée en premier ?', 'Un seul choix.') +
      '<div class="liste-choix">' + C.themes.map(t => ligneChoix('priorite', t.id, t.icone, t.titre, rep.priorite === t.id)).join('') +
      '</div>' + boutonsBas({ passer: true }) + '</div>';
  }

  function ligneChoix(type, id, ic, titre, actif) {
    return '<button type="button" class="choix-ligne" data-' + type + '="' + id + '" aria-pressed="' + actif + '">' +
      icone(ic) + '<span class="choix-texte">' + esc(titre) + '</span><span class="coche">' + icone('valider') + '</span></button>';
  }

  function boutonsBas(o) {
    if (depuisRecap) return '<div class="actions"><button type="button" class="btn btn-secondaire" data-action="recap">Revenir à la vérification</button></div>';
    return o.passer ? '<div class="actions"><button type="button" class="btn btn-discret" data-action="passer">Je ne sais pas / Passer</button></div>' : '';
  }

  function rendreRecap() {
    const vide = !aDesReponses();
    const titreTheme = id => (C.themes.find(t => t.id === id) || {}).titre || '';
    const ligne = (id, titre, valeur, classe) =>
      '<button type="button" class="recap-ligne ' + (classe || '') + '" data-modifier="' + id + '">' +
      '<span class="recap-titre">' + esc(titre) + '</span><span class="recap-valeur">' + valeur + '</span>' + icone('modifier', 'ic-modifier') + '</button>';

    let h = enTete('valider', 'Dernière étape', 'Vérifiez vos réponses', 'Touchez une ligne pour la modifier.') + '<div class="recap">';
    h += '<div class="recap-intertitre">Votre avis par thème</div>';
    C.themes.forEach(t => {
      const n = rep.notes[t.id];
      const e = C.echelle.find(x => x.valeur === n);
      h += ligne(t.id, t.titre, n ? visage(n).replace('class="visage', 'class="visage rempli') + '<span class="sr">' + e.libelle + '</span>' : '—');
    });
    h += '<div class="recap-intertitre">Pour finir</div>';
    const am = rep.ameliorations.indexOf('aucun') >= 0 ? 'Rien de particulier'
      : rep.ameliorations.length ? rep.ameliorations.map(titreTheme).join(', ') : '—';
    h += ligne('ameliorations', 'Ce qui s’est amélioré', esc(am));
    h += ligne('priorite', 'Priorité n° 1', rep.priorite ? esc(titreTheme(rep.priorite)) : '—');
    h += '</div><div id="zone-erreur"></div><div class="actions">' +
      '<button type="button" class="btn btn-principal" data-action="envoyer"' + (vide ? ' disabled' : '') + '>' + icone('valider') + 'Envoyer mon avis</button>' +
      (vide ? '<p class="detail" style="text-align:center;margin:0">Donnez au moins un avis pour pouvoir envoyer.</p>' : '') +
      '</div></div>';
    return h;
  }

  async function rendreMerci() {
    envoye = true;
    history.replaceState({ etape: 'merci' }, '', '#merci');
    $retour.hidden = true;
    document.getElementById('progression').style.visibility = 'hidden';
    $ecran.innerHTML = '<div class="merci"><div class="merci-ic">' + icone('valider') + '</div>' +
      '<h2>Merci !</h2><p>Votre avis est bien envoyé. Il rejoint celui de vos voisins dans le prochain compte rendu.</p>' +
      '<div class="compteur" id="compteur" hidden><strong id="compteur-nb"></strong><span id="compteur-texte"></span></div>' +
      '<div class="actions"><a class="btn btn-principal" href="index.html">Retour à l’accueil</a></div></div>';
    $ecran.className = 'ecran entre-avant';
    try {
      const n = await S.nombreParticipants(PERIODE);
      document.getElementById('compteur-nb').textContent = n;
      document.getElementById('compteur-texte').textContent = n > 1 ? 'foyers ont donné leur avis pour ' + C.periode.libelle + '. Ensemble, on pèse.' : 'foyer a donné son avis pour ' + C.periode.libelle + '. Merci d’ouvrir la voie.';
      document.getElementById('compteur').hidden = false;
    } catch (e) { /* le compteur est un bonus */ }
  }

  // ---------- Interactions ----------
  function brancher(etape) {
    $ecran.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => action(b.dataset.action, b)));

    const formCode = document.getElementById('form-code');
    if (formCode) formCode.addEventListener('submit', async e => {
      e.preventDefault();
      const champ = document.getElementById('champ-code');
      const erreur = document.getElementById('code-erreur');
      const bouton = formCode.querySelector('button');
      erreur.textContent = '';
      champ.classList.remove('tremble');
      if (!champ.value.trim()) { champ.focus(); return; }
      bouton.disabled = true;
      bouton.textContent = 'Vérification…';
      let ok = false;
      try { ok = await S.verifierCode(champ.value); } catch (err) {
        erreur.textContent = 'Vérification impossible. Vérifiez votre connexion et réessayez.';
      }
      if (ok) { await chargerEtat(); return; }
      if (!erreur.textContent) {
        erreur.textContent = 'Code incorrect.';
        void champ.offsetWidth;
        champ.classList.add('tremble');
      }
      bouton.disabled = false;
      bouton.innerHTML = icone('cadenas') + 'Valider le code';
      champ.select();
    });

    $ecran.querySelectorAll('[data-note]').forEach(b => b.addEventListener('click', () => {
      const v = Number(b.dataset.note);
      if (rep.notes[etape.theme.id] === v) {          // second toucher : annule le choix
        delete rep.notes[etape.theme.id];
        b.setAttribute('aria-pressed', 'false');
        clearTimeout(minuteur);
        sauver();
        return;
      }
      rep.notes[etape.theme.id] = v;
      marquer('[data-note]', b);
      sauver();
      avancerBientot();
    }));

    $ecran.querySelectorAll('[data-amelioration]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.amelioration;
      let liste = rep.ameliorations.filter(x => x !== id);
      if (liste.length === rep.ameliorations.length) {
        liste = id === 'aucun' ? ['aucun'] : liste.filter(x => x !== 'aucun').concat(id);
      }
      rep.ameliorations = liste;
      $ecran.querySelectorAll('[data-amelioration]').forEach(x =>
        x.setAttribute('aria-pressed', String(liste.indexOf(x.dataset.amelioration) >= 0)));
      sauver();
    }));

    $ecran.querySelectorAll('[data-priorite]').forEach(b => b.addEventListener('click', () => {
      if (rep.priorite === b.dataset.priorite) {
        rep.priorite = null;
        b.setAttribute('aria-pressed', 'false');
        clearTimeout(minuteur);
        sauver();
        return;
      }
      rep.priorite = b.dataset.priorite;
      marquer('[data-priorite]', b);
      sauver();
      avancerBientot();
    }));

    $ecran.querySelectorAll('[data-modifier]').forEach(b => b.addEventListener('click', () => {
      depuisRecap = true;
      aller(indexDe(b.dataset.modifier));
    }));
  }

  function marquer(selecteur, actif) {
    $ecran.querySelectorAll(selecteur).forEach(x => x.setAttribute('aria-pressed', String(x === actif)));
  }

  function avancerBientot() {
    clearTimeout(minuteur);
    const ici = courant;
    minuteur = setTimeout(() => { if (courant === ici) suivant(); }, DELAI_AVANCE);
  }

  function action(nom) {
    switch (nom) {
      case 'commencer': aller(1); break;
      case 'reprendre': aller(Math.max(1, indexDe(rep.derniere))); break;
      case 'recommencer':
        confirmer({ titre: 'Tout recommencer ?', texte: 'Les réponses déjà données seront effacées.', oui: 'Recommencer', non: 'Annuler' })
          .then(ok => { if (ok) { rep = brouillonVide(); effacerBrouillon(); aller(1); } });
        break;
      case 'modifier': {
        const d = dejaEnvoye;
        rep = Object.assign(brouillonVide(), {
          notes: Object.assign({}, d.notes), ameliorations: (d.ameliorations || []).slice(), priorite: d.priorite || null
        });
        sauver();
        aller(indexDe('recap'));
        break;
      }
      case 'passer': suivant(); break;
      case 'continuer': suivant(); break;
      case 'recap': history.back(); break;
      case 'envoyer': envoyer(); break;
    }
  }

  async function envoyer() {
    if (envoiEnCours || !aDesReponses()) return;
    envoiEnCours = true;
    const bouton = $ecran.querySelector('[data-action="envoyer"]');
    const zone = document.getElementById('zone-erreur');
    zone.innerHTML = '';
    bouton.disabled = true;
    bouton.textContent = 'Envoi…';
    try {
      const envoi = { notes: rep.notes, ameliorations: rep.ameliorations, priorite: rep.priorite };
      await S.envoyer(PERIODE, envoi);
      dejaEnvoye = envoi;
      effacerBrouillon();
      rendreMerci();
    } catch (e) {
      const majSite = e && e.message === 'maj';
      const texte = majSite
        ? 'Le questionnaire a été mis à jour depuis l’ouverture de cette page, ou la consultation vient d’être fermée. Rechargez la page : vos réponses sont gardées.'
        : 'L’envoi n’a pas abouti. Vérifiez votre connexion : vos réponses sont gardées.';
      zone.innerHTML = '<div class="alerte" role="alert">' + icone(majSite ? 'reseau' : 'reseau') + '<span>' + texte + '</span></div>' +
        (majSite ? '<div class="actions"><button type="button" class="btn btn-principal" data-action="recharger">Recharger la page</button></div>' : '');
      if (majSite) { const r = zone.querySelector('[data-action="recharger"]'); if (r) r.addEventListener('click', () => location.reload()); }
      bouton.disabled = false;
      bouton.innerHTML = icone('valider') + 'Réessayer l’envoi';
    } finally {
      envoiEnCours = false;
    }
  }

  // ---------- Fenêtre de confirmation ----------
  function confirmer(o) {
    return new Promise(resolve => {
      const voile = document.createElement('div');
      voile.className = 'voile';
      voile.innerHTML = '<div class="dialogue" role="alertdialog" aria-modal="true" aria-labelledby="d-titre">' +
        '<h3 id="d-titre">' + esc(o.titre) + '</h3><p>' + esc(o.texte) + '</p>' +
        '<div class="actions" style="margin-top:0"><button type="button" class="btn btn-principal" data-r="non">' + esc(o.non) + '</button>' +
        '<button type="button" class="btn btn-secondaire" data-r="oui">' + esc(o.oui) + '</button></div></div>';
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

  // ---------- Démarrage ----------
  // Avis déjà envoyé depuis ce téléphone ? (demande au serveur, une seule fois)
  async function chargerEtat() {
    try {
      const p = await S.periodeOuverte();
      if (p && p.id) C.periode = p;
      fermee = p && (p.statut === 'pause' || p.statut === 'close') ? p.statut : null;
    } catch (e) { /* période de config.js par défaut */ }
    PERIODE = C.periode.id;
    CLE_BROUILLON = 'voix.brouillon.' + PERIODE;
    const b = charger();
    if (b && !aDesReponses()) rep = Object.assign(brouillonVide(), b);
    if (S.aUnCode()) {
      try { dejaEnvoye = await S.maReponse(PERIODE); } catch (e) { dejaEnvoye = null; }
      pret = true;
    }
    if (courant === 0 && !envoye) afficher(0, '');
  }

  history.replaceState({ etape: 0 }, '', location.pathname + location.search);
  afficher(0, '');
  chargerEtat();
})();
