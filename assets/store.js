// Enregistrement des avis.
// Firebase si la configuration est chargée ; sinon MODE TEST (tout reste dans ce navigateur).
(function () {
  const attendre = ms => new Promise(r => setTimeout(r, ms));
  const lireLocal = cle => { try { return localStorage.getItem(cle); } catch (e) { return null; } };
  const ecrireLocal = (cle, v) => { try { localStorage.setItem(cle, v); } catch (e) { /* stockage indisponible */ } };

  function avecDelai(promesse, ms) {
    return Promise.race([promesse, attendre(ms).then(() => { throw new Error('delai'); })]);
  }

  // ---------- Firebase ----------
  if (window.firebase && window.VOIX_FIREBASE) {
    firebase.initializeApp(window.VOIX_FIREBASE);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const etatPret = new Promise(r => { const off = auth.onAuthStateChanged(u => { off(); r(u); }); });

    async function utilisateur() {
      await etatPret;
      if (auth.currentUser) return auth.currentUser;
      return (await auth.signInAnonymously()).user;
    }
    async function monAvis(periode) {
      const u = await utilisateur();
      const doc = await db.collection('avis').doc(periode + '_' + u.uid).get();
      return doc.exists ? doc.data() : null;
    }

    window.VoixStore = {
      mode: 'firebase',
      aUnCode: () => true,   // pas de code des résidents pour l'instant

      maReponse: periode => avecDelai(monAvis(periode), 12000),

      // Période ouverte aux avis, réglée depuis le cockpit.
      async periodeOuverte() {
        const doc = await avecDelai(db.collection('reglages').doc('periode').get(), 8000);
        return doc.exists ? doc.data() : null;
      },

      async envoyer(periode, reponses) {
        if (!navigator.onLine) throw new Error('hors-ligne');
        const u = await utilisateur();
        const refAvis = db.collection('avis').doc(periode + '_' + u.uid);
        const deja = (await refAvis.get()).exists;
        const donnees = {
          uid: u.uid, periode, residence: window.VOIX_CONFIG.residence,
          batiment: reponses.batiment, notes: reponses.notes,
          ameliorations: reponses.ameliorations, priorite: reponses.priorite || null,
          envoyeLe: firebase.firestore.FieldValue.serverTimestamp()
        };
        const lot = db.batch();
        lot.set(refAvis, donnees);
        if (!deja) lot.set(db.collection('compteurs').doc(periode), { total: firebase.firestore.FieldValue.increment(1) }, { merge: true });
        await avecDelai(lot.commit(), 15000);
      },

      async nombreParticipants(periode) {
        const doc = await db.collection('compteurs').doc(periode).get();
        return doc.exists ? (doc.data().total || 0) : 0;
      }
    };
    return;
  }

  // ---------- Mode test (sans Firebase) ----------
  const CLE_REPONSES = 'voix.test.reponses';
  const cleMienne = periode => 'voix.mienne.' + periode;
  const lire = () => { try { return JSON.parse(lireLocal(CLE_REPONSES)) || {}; } catch (e) { return {}; } };

  window.VoixStore = {
    mode: 'test',
    aUnCode: () => true,
    async periodeOuverte() { return null; },

    async maReponse(periode) {
      const id = lireLocal(cleMienne(periode));
      return id ? (lire()[id] || null) : null;
    },

    async envoyer(periode, reponses) {
      await attendre(700);
      if (!navigator.onLine) throw new Error('hors-ligne');
      const toutes = lire();
      const id = lireLocal(cleMienne(periode)) || 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      toutes[id] = Object.assign({}, reponses, { periode, residence: window.VOIX_CONFIG.residence, envoyeLe: new Date().toISOString() });
      ecrireLocal(CLE_REPONSES, JSON.stringify(toutes));
      ecrireLocal(cleMienne(periode), id);
    },

    async nombreParticipants(periode) {
      return Object.values(lire()).filter(r => r.periode === periode).length;
    }
  };
})();
