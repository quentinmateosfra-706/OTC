(function () {
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fr = new Intl.NumberFormat('fr-FR');
  function $(id) { return document.getElementById(id); }
  function num(v) { var n = parseInt(String(v).replace(/[^\d]/g, ''), 10); return isNaN(n) ? 0 : n; }
  function store(key, val) { try { if (val === undefined) { var v = sessionStorage.getItem(key); sessionStorage.removeItem(key); return v; } sessionStorage.setItem(key, val); } catch (e) { return null; } }

  // Apparitions au défilement
  var blocks = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    blocks.forEach(function (b) { io.observe(b); });
  } else {
    blocks.forEach(function (b) { b.classList.add('in'); });
  }
  setTimeout(function () { blocks.forEach(function (b) { b.classList.add('in'); }); }, 2500);

  // Chiffres qui défilent
  document.querySelectorAll('[data-count]').forEach(function (el) {
    if (reduce) return;
    var target = parseFloat(el.dataset.count), suf = el.dataset.suffix || '', t0 = null, dur = 1200;
    function fmt(v) { return (Math.round(v) < 0 ? '−' : '') + Math.abs(Math.round(v)) + suf; }
    el.textContent = fmt(0);
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e);
      if (p < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 350);
  });

  // Toiture avant / après (dessin)
  var card = $('roofcard');
  if (card) {
    var roof = $('roof'), temp = $('temp'), tempc = $('tempc');
    var tbtn = card.querySelectorAll('.toggle button');
    var touched = false;
    var setRoof = function (s) {
      var apres = s === 'apres';
      card.dataset.state = s;
      roof.setAttribute('fill', apres ? '#f4f4ed' : '#3a4248');
      temp.textContent = apres ? '45 °C' : '70 °C';
      temp.style.color = apres ? 'var(--blue)' : 'var(--hot)';
      tempc.textContent = apres ? 'même soleil, toiture traitée' : "toiture sombre, plein soleil d'été";
      tbtn.forEach(function (o) { o.setAttribute('aria-pressed', o.dataset.s === s ? 'true' : 'false'); });
    };
    tbtn.forEach(function (b) {
      b.addEventListener('click', function () { touched = true; setRoof(b.dataset.s); });
    });
    if ('IntersectionObserver' in window) {
      var rio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { rio.disconnect(); setTimeout(function () { if (!touched) setRoof('apres'); }, 900); }
      }, { threshold: 0.6 });
      rio.observe(card);
    }
  }

  // Avant / après de la cloison
  var ba = $('ba'), baR = $('ba-range');
  if (ba && baR) baR.addEventListener('input', function () { ba.style.setProperty('--pos', baR.value + '%'); });

  // Nuancier
  var wall = $('wall');
  if (wall) {
    var sw = document.querySelectorAll('.swatch');
    sw.forEach(function (b) {
      b.addEventListener('click', function () {
        wall.setAttribute('fill', b.dataset.c);
        sw.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      });
    });
  }

  // Simulateur
  var sRange = $('s-range');
  if (sRange) {
    var sim = { surf: 1000, sup: 'lisse', clim: 'oui' };
    var sSurf = $('s-surf'), sBill = $('s-bill');
    var summary = '';
    var compute = function () {
      var surf = sim.surf;
      var perM2 = sim.sup === 'lisse' ? 1 / 3 : 0.5;  // 2 couches : 5 L = 15 m² (lisse), 5 L = 10 m² (rugueux)
      var litres = Math.ceil(surf * perM2);
      var seaux = Math.ceil(litres / 17);
      $('r-paint').textContent = fr.format(litres) + ' L';
      $('r-paint-d').textContent = 'de peinture pour 2 couches, soit ' + seaux + ' seau' + (seaux > 1 ? 'x' : '') + ' de 17 L';
      var clim = sim.clim === 'oui';
      $('s-bill-row').hidden = !clim;
      $('r-temp-d').textContent = clim ? "à l'intérieur en moyenne, jusqu'à −8 °C en pic" : "à l'intérieur en moyenne : les étages sous toiture redeviennent vivables";
      var bill = num(sBill.value), eco = $('r-eco'), ecoD = $('r-eco-d');
      if (!clim) { eco.textContent = 'Confort'; ecoD.textContent = "d'été retrouvé sans installer de climatisation"; }
      else if (bill > 0) { eco.textContent = fr.format(Math.round(bill * 0.29)) + ' €'; ecoD.textContent = "d'économie de climatisation par an (−29 %)"; }
      else { eco.textContent = '−29 %'; ecoD.textContent = 'sur la facture de climatisation. Indiquez-la pour voir le montant'; }
      summary = 'Simulateur : ' + fr.format(surf) + ' m², toiture ' + (sim.sup === 'lisse' ? 'lisse' : 'rugueuse') + ', ' + (clim ? 'climatisé' : 'non climatisé') +
        (clim && bill ? ', facture clim ' + fr.format(bill) + ' €/an, économie estimée ' + fr.format(Math.round(bill * 0.29)) + ' €/an' : '') +
        ', peinture estimée ' + fr.format(litres) + ' L.';
    };
    var segs = function (id, key) {
      var bs = document.querySelectorAll('#' + id + ' button');
      bs.forEach(function (b) {
        b.addEventListener('click', function () {
          sim[key] = b.dataset.v;
          bs.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
          compute();
        });
      });
    };
    segs('s-sup', 'sup'); segs('s-clim', 'clim');
    sRange.addEventListener('input', function () { sim.surf = num(sRange.value); sSurf.value = fr.format(sim.surf); compute(); });
    sSurf.addEventListener('input', function () { sim.surf = num(sSurf.value); sRange.value = Math.min(10000, Math.max(50, sim.surf)); compute(); });
    sSurf.addEventListener('blur', function () { sSurf.value = fr.format(sim.surf); });
    sBill.addEventListener('input', compute);
    sBill.addEventListener('blur', function () { var b = num(sBill.value); sBill.value = b ? fr.format(b) : ''; });
    compute();
    // L'estimation suit le visiteur jusqu'à la page de contact
    $('s-cta').addEventListener('click', function () {
      store('mp-sim', JSON.stringify({ surf: sim.surf, summary: summary }));
    });
  }

  // Formulaire : enregistre la demande dans Base44
  var form = $('quote');
  if (form) {
    var saved = store('mp-sim');
    if (saved) {
      try {
        var s = JSON.parse(saved);
        $('f-type').value = 'Cool roofing (toiture)';
        $('f-surf').value = s.surf;
        $('f-est').value = s.summary;
        $('f-msg').value = s.summary + ' ';
      } catch (e) { /* estimation illisible : formulaire vide */ }
    }
    if (location.hash === '#interieur') $('f-type').value = 'Peinture intérieure';
    var APP_ID = '6adf9892ccf39d45a3d04ec2';
    var ok = $('form-ok');
    var sendBtn = form.querySelector('button[type=submit]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = form.nom.value.trim(), tel = form.tel.value.trim();
      ok.hidden = false; ok.classList.remove('err');
      if (!nom || !tel) {
        ok.classList.add('err');
        ok.textContent = 'Indiquez au moins votre nom et votre téléphone pour être recontacté.';
        (nom ? form.tel : form.nom).focus();
        return;
      }
      var record = {
        nom: nom, telephone: tel, email: form.mail.value.trim(), ville: form.ville.value.trim(),
        type_travaux: form.type.value, surface_m2: num(form.surf.value) || null,
        message: form.msg.value.trim(), estimation: form.estimation.value,
        source: form.estimation.value ? 'simulateur' : 'formulaire', statut: 'nouvelle'
      };
      sendBtn.disabled = true; ok.textContent = 'Envoi en cours…';
      fetch('/api/apps/' + APP_ID + '/entities/DemandeDevis', {
        method: 'POST',
        headers: { 'X-App-Id': APP_ID, 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset(); form.estimation.value = '';
        ok.textContent = 'Merci ' + nom + ', votre demande a bien été transmise. Nous vous recontactons sous 48 h ouvrées.';
      }).catch(function () {
        ok.classList.add('err');
        ok.textContent = "La demande n'a pas pu partir. Contactez-nous directement au 07 69 94 08 31 ou à quentin.mateos@outlook.com.";
      }).then(function () { sendBtn.disabled = false; });
    });
  }

  // ---- v6 : titres mot par mot, photos qui se dévoilent, profondeur, en-tête ----
  document.querySelectorAll('.split-words').forEach(function (h) {
    h.querySelectorAll('.w > span').forEach(function (s, i) { s.style.setProperty('--i', i); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('in'); }); });
  });

  var imgs = document.querySelectorAll('.reveal-img');
  if ('IntersectionObserver' in window) {
    var rio2 = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio2.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    imgs.forEach(function (el) { rio2.observe(el); });
  }
  setTimeout(function () { imgs.forEach(function (el) { el.classList.add('in'); }); }, 2500);

  var hdr = document.getElementById('top');
  var par = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;
  function onScroll() {
    if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 12);
    var vh = window.innerHeight;
    par.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;  // -1 … 1
      img.style.transform = 'translate3d(0,' + (p * -9).toFixed(2) + '%,0)';
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
