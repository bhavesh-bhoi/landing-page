// Paste your appointment form link here (Google Forms, Typeform, Calendly, etc.).
// While this is empty, "Book an appointment" buttons simply scroll to the contact form.
const APPOINTMENT_FORM_URL = '';

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;

  /* ---------- Basics (no libraries needed) ---------- */
  $('#year').textContent = new Date().getFullYear();

  const burger = $('#burger'), links = $('#navLinks');
  const setMenu = open => {
    burger.classList.toggle('open', open);
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));

  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('a:not(.btn)', links).forEach(a => a.classList.toggle('active', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  // Card spotlight follows the cursor
  $$('.svc').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', e.clientX - r.left + 'px');
    c.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  // Footer wordmark: red spotlight follows the pointer
  const word = $('.footer__word');
  if (word) word.addEventListener('pointermove', e => {
    const r = word.getBoundingClientRect();
    word.style.setProperty('--mx', e.clientX - r.left + 'px');
    word.style.setProperty('--my', e.clientY - r.top + 'px');
  });

  /* ---------- Appointment form pop-up ---------- */
  const dlg = $('#apptDialog'), frame = $('#apptFrame');
  const closeDlg = () => { dlg.close(); frame.src = 'about:blank'; };
  $$('[data-appointment]').forEach(a => a.addEventListener('click', e => {
    if (!APPOINTMENT_FORM_URL || !dlg.showModal) return; // falls back to the #contact anchor
    e.preventDefault();
    setMenu(false);
    // Google Forms need ?embedded=true to render nicely inside an iframe
    const url = /docs\.google\.com\/forms/.test(APPOINTMENT_FORM_URL) && !/embedded=/.test(APPOINTMENT_FORM_URL)
      ? APPOINTMENT_FORM_URL + (APPOINTMENT_FORM_URL.includes('?') ? '&' : '?') + 'embedded=true' : APPOINTMENT_FORM_URL;
    frame.src = url;
    $('#apptOpen').href = APPOINTMENT_FORM_URL;
    dlg.showModal();
  }));
  $('#apptClose').addEventListener('click', closeDlg);
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });

  /* ---------- Animation (GSAP + Motion) ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduce) { root.classList.add('no-anim'); return; }

  try {
    initAnimations();
  } catch (err) {
    console.error('Animation setup failed, showing static page', err);
    root.classList.add('no-anim');
    window.gsap && gsap.killTweensOf('*');
  }

  function initAnimations() {
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
    gsap.defaults({ ease: 'power3.out' });
    const M = window.Motion;
    if (M) root.classList.add('motion-ready');
    const prep = el => { const L = el.getTotalLength(); el.style.strokeDasharray = L; el.style.strokeDashoffset = L; return L; };
    const ctr = els => gsap.set(els, { transformOrigin: '50% 50%' });

    // Scroll progress bar
    gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

    /* Hero intro */
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .fromTo('h1 .line>span', { yPercent: 110, autoAlpha: 1 }, { yPercent: 0, duration: 1.1, stagger: 0.14 }, 0.1)
      .fromTo('.rise', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.12 }, 0.25)
      .add(() => $('h1 em').classList.add('on'), 1.1);

    /* Hero illustration */
    const heroArt = () => {
      const svg = $('#heroArt svg');
      const C = '280 215';
      const conns = $$('.conn', svg);
      conns.forEach(prep);
      $$('.sat', svg).forEach(s => gsap.set(s, { x: +s.dataset.x, y: +s.dataset.y }));
      ctr($$('.pill, .hub, .spark', svg));
      gsap.set($$('.packet', svg), { opacity: 0 });

      const tl = gsap.timeline({ delay: 0.4 });
      tl.set('#heroArt', { autoAlpha: 1 })
        .from('.ring', { opacity: 0, duration: 1.2, stagger: 0.15 }, 0)
        .from('.hub', { scale: 0, duration: 0.9, ease: 'back.out(1.7)' }, 0.1)
        .to(conns, { strokeDashoffset: 0, duration: 1.2, stagger: 0.12, ease: 'power2.inOut' }, 0.5)
        .from('.pill', { scale: 0, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'back.out(2)' }, 1)
        .from('.spark', { scale: 0, opacity: 0, duration: 0.5, stagger: 0.1 }, 1.4)
        .from('.wf', { y: 36, autoAlpha: 0, duration: 0.9 }, 1.3)
        .add(startLoops, 1.5);

      function startLoops() {
        // Packets travelling hub → service nodes
        $$('.packet', svg).forEach((p, i) => {
          gsap.set(p, { opacity: 1 });
          gsap.to(p, {
            motionPath: { path: conns[i], align: conns[i], alignOrigin: [0.5, 0.5] },
            duration: 2.4 + i * 0.35, delay: i * 0.45, repeat: -1, repeatDelay: 0.5, ease: 'power1.inOut'
          });
        });
        // Rings turn at different speeds, in alternating directions
        $$('.ring', svg).forEach((r, i) => gsap.to(r, { rotation: i % 2 ? -360 : 360, svgOrigin: C, duration: 50 + i * 22, repeat: -1, ease: 'none' }));
        // Hub pulse
        gsap.fromTo('.pulse', { scale: 1, opacity: 0.55, svgOrigin: C }, { scale: 1.9, opacity: 0, duration: 2.4, repeat: -1, ease: 'power1.out' });
        // Gentle float on the pills
        $$('.pill', svg).forEach((p, i) => gsap.to(p, { y: i % 2 ? -9 : 9, duration: 2.4 + i * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
        gsap.to('.spark', { scale: 0.4, opacity: 0.35, duration: 1.4, stagger: { each: 0.4, repeat: -1, yoyo: true }, ease: 'sine.inOut' });
        gsap.to('.wf', { y: -8, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      }
    };
    heroArt();

    // Workflow card: steps tick off, then reset
    (() => {
      const items = $$('.wf li');
      const wf = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 1.8, defaults: { ease: 'power2.out' } });
      wf.set(items, { opacity: 0.5 });
      items.forEach((li, i) => {
        const t = i * 1.0;
        wf.to(li, { opacity: 1, duration: 0.3 }, t)
          .to($('circle', li), { fill: '#b5191f', stroke: '#b5191f', duration: 0.3 }, t + 0.25)
          .to($('path', li), { strokeDashoffset: 0, duration: 0.35 }, t + 0.3);
      });
      wf.to('.wf__bar span', { scaleX: 1, duration: items.length * 1.0, ease: 'none' }, 0);
      wf.set('.wf__bar span', { scaleX: 0 }, '+=0.01');
      wf.to({}, { duration: 0.2 });
    })();

    // Parallax on the dotted background and art
    gsap.to('.hero__dots', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__art', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* Scroll reveals */
    ScrollTrigger.batch('.reveal', {
      start: 'top 90%', once: true,
      onEnter: els => gsap.fromTo(els, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.1, overwrite: true })
    });

    /* About: a dot rides the path as you scroll */
    (() => {
      const path = $('#jPath'), fill = $('#jFill'), rider = $('.j-rider');
      const L = prep(fill), nodes = $$('.j-node');
      const stops = [0, 0.5, 1], offs = [[0, -24], [0, -24], [0, 26]];
      nodes.forEach((n, i) => {
        const p = path.getPointAtLength(L * stops[i]);
        $('circle', n).setAttribute('cx', p.x); $('circle', n).setAttribute('cy', p.y);
        const t = $('text', n); t.setAttribute('x', p.x); t.setAttribute('y', p.y + offs[i][1] + (offs[i][1] > 0 ? 4 : 0));
      });
      nodes[0].classList.add('on');
      gsap.timeline({
        scrollTrigger: {
          trigger: '.about', start: 'top 55%', end: 'bottom 75%', scrub: 0.6,
          onUpdate: s => nodes.forEach((n, i) => n.classList.toggle('on', s.progress >= stops[i] - 0.02))
        }
      })
        .to(fill, { strokeDashoffset: 0, ease: 'none' }, 0)
        .to(rider, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, ease: 'none' }, 0);
    })();

    /* Services: each graphic draws in once, then loops while on screen */
    const stageAnims = {
      // Fresh website: the page builds itself, then a cursor browses it
      web(card) {
        const win = $('.win', card), blocks = $$('.blk', card), lines = $$('.wline', card), cur = $('.cursor', card), cards = $$('.blk-c', card);
        lines.forEach(prep); gsap.set(cur, { x: 150, y: 120, opacity: 0 });
        const intro = gsap.timeline({ paused: true })
          .from(win, { opacity: 0, scale: 0.92, transformOrigin: '50% 50%', duration: 0.6 })
          .from(blocks, { scaleY: 0, opacity: 0, duration: 0.55, stagger: 0.12, ease: 'back.out(1.5)' }, 0.3)
          .to(lines, { strokeDashoffset: 0, duration: 0.6, stagger: 0.1 }, 0.9)
          .to(cur, { opacity: 1, duration: 0.3 }, 1.2);
        const loops = [
          gsap.timeline({ repeat: -1, paused: true, delay: 1.4, defaults: { duration: 1.2, ease: 'power2.inOut' } })
            .to(cur, { x: 60, y: 108 }).to(cur, { x: 112, y: 112 }).to(cur, { x: 164, y: 70 }).to(cur, { x: 150, y: 120 }),
          gsap.to(cards, { fillOpacity: 0.5, duration: 0.7, stagger: { each: 0.5, repeat: -1, yoyo: true }, ease: 'sine.inOut', paused: true })
        ];
        return { intro, loops };
      },
      // Redesign: before / after slider sweeps back and forth
      redo(card) {
        const clip = $('.redo-clip', card), handle = $('.redo-handle', card), knob = $('.redo-knob', card);
        const pos = { x: 110 };
        const apply = () => {
          gsap.set(clip, { attr: { width: pos.x - 22 } });
          gsap.set(handle, { attr: { x1: pos.x, x2: pos.x } });
          gsap.set(knob, { attr: { cx: pos.x } });
        };
        const intro = gsap.timeline({ paused: true }).from('.win', { opacity: 0, duration: 0.6 }, 0).from([handle, knob], { opacity: 0, duration: 0.4 }, 0.3);
        const loops = [gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.5, paused: true })
          .fromTo(pos, { x: 38 }, { x: 182, duration: 2.8, ease: 'sine.inOut', onUpdate: apply })];
        apply();
        return { intro, loops };
      },
      // SEO: your result climbs to the top of the search list
      seo(card) {
        const rows = $$('.row', card), you = $('.row--you', card), b = $('.row--b', card), c = $('.row--c', card);
        const bar = $('.sline', card), mag = $('.mag', card);
        prep(bar);
        const intro = gsap.timeline({ paused: true })
          .to(bar, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' })
          .from(rows, { opacity: 0, x: -24, duration: 0.6, stagger: 0.12 }, 0.3)
          .from(mag, { scale: 0, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(2)' }, 0.2);
        const climb = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 1.3, delay: 1.5, paused: true, defaults: { duration: 1, ease: 'power3.inOut' } })
          .to(you, { y: 56 }, 0).to(b, { y: 86 }, 0).to(c, { y: 116 }, 0);
        const loops = [climb, gsap.to(mag, { x: -4, y: 3, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', paused: true })];
        return { intro, loops };
      }
    };
    $$('.svc').forEach(card => {
      const { intro, loops } = stageAnims[card.dataset.gfx](card);
      let played = false;
      ScrollTrigger.create({
        trigger: card, start: 'top 80%',
        onEnter: () => { if (!played) { played = true; intro.play(); } },
      });
      ScrollTrigger.create({
        trigger: card, start: 'top bottom', end: 'bottom top',
        onToggle: s => loops.forEach(t => s.isActive ? t.play() : t.pause())
      });
    });

    /* Pricing: the ₹35,000 counts up when it scrolls into view */
    const priceEl = $('.price__num');
    if (priceEl) {
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: priceEl, start: 'top 88%', once: true,
        onEnter: () => gsap.to(o, { v: 35000, duration: 1.8, ease: 'power2.out', onUpdate: () => { priceEl.textContent = Math.round(o.v).toLocaleString('en-IN'); } })
      });
    }

    /* Contact: signal rings ping outward */
    const rings = $$('.contact__art circle:not(.core)');
    ctr(rings);
    gsap.fromTo(rings, { scale: 0.1, opacity: 0.7 }, { scale: 1, opacity: 0, duration: 4.5, stagger: 1.5, repeat: -1, ease: 'power1.out' });

    /* Motion: springy micro-interactions */
    if (M) {
      const spring = { type: 'spring', stiffness: 260, damping: 18 };
      $$('.btn').forEach(btn => {
        btn.addEventListener('pointermove', e => {
          const r = btn.getBoundingClientRect();
          M.animate(btn, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.35 }, spring);
        });
        btn.addEventListener('pointerleave', () => M.animate(btn, { x: 0, y: 0 }, spring));
      });
      if (M.hover) M.hover('.svc', card => {
        const svg = $('.stage svg', card);
        M.animate(svg, { scale: 1.07, rotate: -1.5 }, spring);
        return () => M.animate(svg, { scale: 1, rotate: 0 }, spring);
      });
      if (M.inView) M.inView('.tags', ({ target }) => {
        M.animate([...target.children], { opacity: [0, 1], y: [12, 0] }, { delay: M.stagger(0.07), duration: 0.5 });
      }, { margin: '0px 0px -10% 0px' });
    }

    // Recalculate positions once fonts and images have settled
    addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
