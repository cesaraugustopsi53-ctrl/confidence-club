(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Entrada do hero (escrita do "Confidence" + copy)
  requestAnimationFrame(function () { document.body.classList.add('loaded'); });

  // Reveals no scroll
  var targets = document.querySelectorAll('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  // Text reveal: quebra em palavras, mantendo <em>
  var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-text-reveal]')).map(function (el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span');
        s.className = 'w';
        s.textContent = part;
        frag.appendChild(s);
      });
      n.parentNode.replaceChild(frag, n);
    });
    return { el: el, words: el.querySelectorAll('.w') };
  });

  // Túnel em perspectiva
  var tunnel = document.querySelector('.tunnel');
  var tCards = tunnel ? Array.prototype.slice.call(tunnel.querySelectorAll('.t-card')) : [];
  // no mobile (e com movimento reduzido) o túnel vira grade estática, sem 3D
  var tunnelMq = window.matchMedia('(max-width: 900px)');
  var tunnelLive = false;
  function setTunnelMode() {
    if (!tunnel) return;
    tunnelLive = !reduce && !tunnelMq.matches;
    tunnel.classList.toggle('tunnel--static', !tunnelLive);
    if (!tunnelLive) tCards.forEach(function (c) { c.style.transform = c.style.opacity = c.style.zIndex = c.style.display = ''; });
  }
  setTunnelMode();
  if (tunnelMq.addEventListener) tunnelMq.addEventListener('change', setTunnelMode);
  var GOLDEN = 137.508 * Math.PI / 180;
  var DEPTH = 1100;

  function updateTunnel(vh) {
    var r = tunnel.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    var p = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
    var vw = window.innerWidth;
    var spreadX = vw < 640 ? vw * 0.3 : vw * 0.3;
    var spreadY = vh * 0.3;
    var travel = (tCards.length + 1.2) * DEPTH;
    tCards.forEach(function (card, i) {
      var z = -(i + 1) * DEPTH + p * travel;
      var a = i * GOLDEN + 0.6;
      var x = Math.cos(a) * spreadX;
      var y = Math.sin(a) * spreadY;
      var rot = (i % 2 ? 1 : -1) * (3 + (i * 7) % 5);
      var fadeIn = Math.min(1, Math.max(0, (z + 4 * DEPTH) / (1.5 * DEPTH)));
      var fadeOut = Math.min(1, Math.max(0, 1 - (z - 250) / 450));
      // fora de cena (longe demais ou já passou da câmera): tira da composição.
      // No iPhone, cards invisíveis perto/atrás da câmera viram camadas gigantes e o Safari apaga a seção inteira.
      if (fadeIn * fadeOut < 0.01) { card.style.display = 'none'; return; }
      card.style.display = '';
      card.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotate(' + rot + 'deg)';
      card.style.opacity = (fadeIn * fadeOut).toFixed(3);
      card.style.zIndex = Math.round(z + 10000);
    });
    tunnel.style.setProperty('--p', p.toFixed(3));
    tunnel.style.setProperty('--fecho', Math.min(1, Math.max(0, (p - 0.78) / 0.15)).toFixed(3));
  }

  // Nav, barra sticky, parallax, túnel, text reveal
  var nav = document.getElementById('nav');
  var bar = document.getElementById('sticky');
  var hero = document.querySelector('.hero');
  var oferta = document.getElementById('oferta');
  var layers = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;
  var tabletStage = document.querySelector('[data-tablet]');
  var tablet = tabletStage && tabletStage.querySelector('.tablet');

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    nav.classList.toggle('scrolled', window.scrollY > 40);

    var heroBottom = hero.getBoundingClientRect().bottom;
    var ofertaRect = oferta.getBoundingClientRect();
    var onOffer = ofertaRect.top < vh && ofertaRect.bottom > 0;
    bar.classList.toggle('visible', heroBottom < 0 && !onOffer);

    layers.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var offset = Math.max(-60, Math.min(60, (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax)));
      el.style.setProperty('--py', offset.toFixed(1) + 'px');
    });

    if (tunnel && tunnelLive) updateTunnel(vh);

    // Tablet: inclinado, endireita quando chega no centro da tela
    if (tablet && !reduce) {
      var tr = tabletStage.getBoundingClientRect();
      var dist = (tr.top + tr.height / 2) - vh / 2;
      var tp = Math.min(1, Math.max(0, 1 - dist / (vh * 0.55)));
      tablet.style.setProperty('--tilt', (28 * (1 - tp)).toFixed(2) + 'deg');
      tablet.style.setProperty('--ts', (0.86 + 0.14 * tp).toFixed(3));
    }

    reveals.forEach(function (rv) {
      var r = rv.el.getBoundingClientRect();
      var p = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (r.height + vh * 0.35)));
      var lit = Math.round(p * rv.words.length);
      for (var i = 0; i < rv.words.length; i++) rv.words[i].classList.toggle('on', i < lit);
    });
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  // FAQ: um aberto por vez
  var items = document.querySelectorAll('.faq-item');
  items.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
})();

// Depoimentos: carrossel arrastável + ampliação
(function () {
  var track = document.querySelector('.depo-track');
  if (!track) return;
  var bar = document.querySelector('.depo-bar i');
  var btns = document.querySelectorAll('.depo-btn');
  var cards = Array.prototype.slice.call(track.querySelectorAll('.depo'));

  function sync() {
    var max = track.scrollWidth - track.clientWidth;
    var p = max > 0 ? track.scrollLeft / max : 1;
    bar.parentNode.style.setProperty('--p', Math.max(0.08, p).toFixed(3));
    bar.style.setProperty('--p', Math.max(0.08, p).toFixed(3));
    btns[0].disabled = track.scrollLeft < 4;
    btns[1].disabled = track.scrollLeft > max - 4;
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.8, behavior: 'smooth' });
    });
  });
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();

  // arrastar com o mouse (no toque o scroll nativo já resolve)
  var drag = null;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; track.classList.add('is-drag'); }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!drag) return;
    var moved = drag.moved;
    drag = null;
    if (moved) setTimeout(function () { track.classList.remove('is-drag'); }, 0);
  });

  // ampliação
  var lb = document.querySelector('.lb');
  var img = lb.querySelector('img');
  var fig = lb.querySelector('.lb-fig');
  var idx = 0, lastFocus = null;
  function show(i) {
    idx = (i + cards.length) % cards.length;
    var src = cards[idx].querySelector('img');
    img.src = src.src; img.width = src.width; img.height = src.height;
    fig.scrollTop = 0;
  }
  function open(i) { lastFocus = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); }
  function close() { lb.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  cards.forEach(function (c, i) { c.addEventListener('click', function () { open(i); }); });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
  });
})();
