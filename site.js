(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('#mobile-menu');
  const menuToggle = document.querySelector('.menu-toggle');
  const menuClose = menu?.querySelector('.menu-close');
  let navigationPending = false;
  const activeAnimations = new Set();
  // Netlify's Pretty URLs rewrite HTML links to extensionless routes in production.
  const sitePages = new Set([
    '/', '/about', '/projects', '/shop', '/the-creative-lens',
    '/meravigliosa-biblioteca', '/the-subtle-art-of-slowing-down',
    '/fondazione-magnani-rocca', '/how-i-see-colors', '/design-week-2025',
    '/creative-direction-music-artist',
    '/diana', '/villa-of-masterpieces', '/girl-of-the-night-garden', '/destiny-noah-baine', '/finding-your-own-path', '/time-and-each-other', '/language-of-wind', '/recco', '/candle-flame-wildfire', '/you-me', '/roncato', '/like-roots', '/liquid-buildings', '/fallin-noah-baine', '/upside-down', '/comacchio', '/dusk-to-night', '/mosaic-biennale', '/trains', '/language-of-light', '/slowing-things-down', '/moft-iphone-setup', '/amsterdam-nikon', '/silence-berlin', '/moft-static', '/polarpro-warp', '/ugmonk-analog', '/italian-garden', '/mymind', '/pocket-dispo', '/brick', '/suspended-daydream', '/moment', '/weapon-distraction', '/moft-24-hours'
  ]);
  const pagePath = url => {
    const path = url.pathname.replace(/\/+$/, '').replace(/\.html$/, '');
    return path === '/index' || path === '' ? '/' : path;
  };

  // Native dialog supplies focus containment, Escape and return-to-trigger focus.
  if (menu && menuToggle && menuClose) {
    menuToggle.addEventListener('click', () => {
      menu.showModal();
      menuToggle.setAttribute('aria-expanded', 'true');
    });
    menuClose.addEventListener('click', () => menu.close());
    menu.addEventListener('close', () => menuToggle.setAttribute('aria-expanded', 'false'));
    menu.addEventListener('click', event => {
      if (event.target !== menu) return;
      const bounds = menu.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) menu.close();
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
      if (event.matches && menu.open) menu.close();
    });
  }

  const revealTargets = [...document.querySelectorAll([
    '.page-intro', '.article-head', '.newsletter-hero', '.shop-intro',
    '.reading-column > .content-section:first-child',
    '.article-media', '.article-hero', '.article-video', '.work-card'
  ].join(','))].filter(element => element.getBoundingClientRect().height > 1);

  let observer;
  const showAll = () => {
    observer?.disconnect();
    revealTargets.forEach(element => {
      element.removeAttribute('data-reveal');
      element.classList.remove('page-enter');
    });
    document.querySelectorAll('.header-enter').forEach(element => element.classList.remove('header-enter'));
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations.clear();
  };

  if (!reducedMotion.matches) {
    document.querySelectorAll('.brand, .header-links > a, .site-nav > a, .header-inner > button, .mobile-work').forEach((element, index) => {
      element.style.setProperty('--intro-delay', `${[0, 120, 170, 220][index % 4]}ms`);
      element.classList.add('header-enter');
    });
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.dataset.reveal = 'shown';
          observer.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    }
    let entryIndex = 0;
    revealTargets.forEach(element => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) {
        element.style.setProperty('--entry-delay', `${100 + Math.min(entryIndex++, 3) * 90}ms`);
        element.classList.add('page-enter');
      } else if (observer && bounds.top >= window.innerHeight) {
        element.dataset.reveal = 'pending';
        observer.observe(element);
      }
    });
  }

  // Same-origin pages retain real URLs and normal browser navigation.
  // The reference's exit is 400ms, y=14, scale=.99, blur=12px, ease [.5,0,.75,0].
  document.addEventListener('click', async event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') ||
        (link.target && link.target !== '_self')) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || !sitePages.has(pagePath(destination))) return;
    if (menu?.open && menu.contains(link)) menu.close();
    if (pagePath(destination) === pagePath(new URL(location.href)) && destination.search === location.search) return;
    if (reducedMotion.matches || typeof Element.prototype.animate !== 'function') return;
    const main = document.querySelector('main');
    if (!main) return;
    event.preventDefault();
    if (navigationPending) return;
    navigationPending = true;
    const exit = main.animate([
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
      { opacity: 0, transform: 'translateY(14px) scale(.99)', filter: 'blur(12px)' }
    ], { duration: 400, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    activeAnimations.add(exit);
    try { await exit.finished; } catch (_) { /* A motion preference change can cancel the exit. */ }
    location.assign(destination.href);
  });

  window.addEventListener('pageshow', event => {
    navigationPending = false;
    if (event.persisted) showAll();
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) showAll();
  });
})();

// Original project publications load only when the visitor opens the embed.
document.querySelectorAll('.project-embed').forEach(details => {
  details.addEventListener('toggle', () => {
    const frame = details.querySelector('iframe[data-project-embed]');
    if (details.open && frame && !frame.hasAttribute('src')) frame.src = frame.dataset.projectEmbed;
  });
});

// Local time in the footer: Parma, updated every 15 seconds.
(() => {
  const el = document.querySelector('.local-time');
  if (!el) return;
  const hh = el.querySelector('[data-hh]'), mm = el.querySelector('[data-mm]');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => { const p = fmt.formatToParts(new Date()); hh.textContent = p.find(x => x.type === 'hour').value; mm.textContent = p.find(x => x.type === 'minute').value; };
  tick(); setInterval(tick, 15000);
})();

// Work page: Grid / Index view, remembered per visitor.
(() => {
  const toggle = document.querySelector('.work-view');
  if (!toggle) return;
  const main = document.querySelector('main');
  const set = view => {
    main.classList.toggle('is-grid', view === 'grid');
    toggle.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    try { localStorage.setItem('mg-work-view', view); } catch (e) {}
  };
  let saved = 'index';
  try { saved = localStorage.getItem('mg-work-view') || 'index'; } catch (e) {}
  set(saved);
  toggle.addEventListener('click', e => { const b = e.target.closest('button'); if (b) set(b.dataset.view); });
})();

// Word fill: split the statement into words so each can take ink in reading order.
(() => {
  document.querySelectorAll('.word-fill').forEach(root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    const words = [];
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const s = document.createElement('span'); s.className = 'wf'; s.textContent = part; words.push(s); frag.append(s);
      });
      node.replaceWith(frag);
    });
    words.forEach((w, i) => w.style.setProperty('--p', (i / Math.max(words.length - 1, 1)).toFixed(3)));
  });
})();

// Home film: pause control, reduced motion, rests off screen, white header while on the film, letters for the arrival.
(() => {
  const hero = document.querySelector('.home-hero.has-film');
  if (!hero) return;
  const video = hero.querySelector('video'), btn = hero.querySelector('.hero-film-toggle'), name = hero.querySelector('.hero-name');
  document.body.classList.add('js-film');
  let i = 0;
  name.setAttribute('aria-label', [...name.querySelectorAll('.hn')].map(w => w.textContent.trim()).join(' '));
  name.querySelectorAll('.hn').forEach(word => {
    const text = word.textContent; word.textContent = ''; word.setAttribute('aria-hidden', 'true');
    [...text].forEach(ch => { const s = document.createElement('span'); s.className = 'ho-char'; s.textContent = ch; s.style.setProperty('--i', i++); word.append(s); });
  });
  // Always playing, always looping. Only the system's reduced-motion setting keeps it on the poster.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { video.removeAttribute('autoplay'); video.pause(); }
  else { video.loop = true; const go = () => video.play().catch(() => {}); go(); video.addEventListener('ended', () => { video.currentTime = 0; go(); }); }
  const header = () => document.body.classList.toggle('past-film', hero.getBoundingClientRect().bottom < 72);
  addEventListener('scroll', header, { passive: true }); addEventListener('resize', header); header();
})();

// Subscribe forms: send to Substack in the background, confirm in place. Without JS the form posts to Substack directly.
(() => {
  document.querySelectorAll('form.subscribe').forEach(form => {
    form.addEventListener('submit', e => {
      const input = form.querySelector('input[type="email"]'), note = form.querySelector('.subscribe-note'), btn = form.querySelector('button');
      if (!input.value || !input.checkValidity()) return;
      e.preventDefault(); btn.disabled = true;
      const body = new URLSearchParams({ email: input.value, first_url: location.href });
      fetch(form.action.replace('?nojs=true', ''), { method: 'POST', mode: 'no-cors', body })
        .then(() => { form.classList.add('is-done'); note.textContent = 'Almost there. A confirm button is waiting in your inbox.'; })
        .catch(() => { btn.disabled = false; form.submit(); });
    });
  });
})();

// Copy the email on devices with a mouse; phones open the mail app.
(() => {
  document.querySelectorAll('[data-copy]').forEach(link => {
    const status = link.parentElement.querySelector('.copy-status');
    if (!window.matchMedia('(pointer: fine)').matches || !navigator.clipboard) return;
    if (status) status.textContent = 'click to copy, no mail app needed';
    link.addEventListener('click', e => {
      e.preventDefault();
      navigator.clipboard.writeText(link.dataset.copy).then(() => {
        if (status) { status.textContent = 'Copied. Talk soon.'; setTimeout(() => { status.textContent = 'click to copy, no mail app needed'; }, 2600); }
      }).catch(() => { location.href = link.href; });
    });
  });
})();

// Work filters.
(() => {
  const bar = document.querySelector('.work-filter');
  if (!bar) return;
  const items = [...document.querySelectorAll('.archive-item[data-cat]')];
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-filter]'); if (!b) return;
    const f = b.dataset.filter;
    bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    items.forEach(it => { it.hidden = f !== 'all' && !it.dataset.cat.split(' ').includes(f); });
    document.querySelectorAll('.archive').forEach(sec => {
      const visible = sec.querySelectorAll('.archive-item[data-cat]:not([hidden])').length;
      sec.hidden = visible === 0;
      const c = sec.querySelector('.archive-section-title .count'); if (c) c.textContent = `(${visible})`;
    });
  });
})();

// Latest film: the YouTube player loads only when asked.
(() => {
  document.querySelectorAll('.yt-frame[data-yt]').forEach(frame => {
    const poster = frame.querySelector('.yt-poster');
    const img = poster.querySelector('img');
    img.addEventListener('error', () => { img.src = `https://i.ytimg.com/vi/${frame.dataset.yt}/hqdefault.jpg`; }, { once: true });
    poster.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${frame.dataset.yt}?autoplay=1&rel=0&modestbranding=1&color=white`;
      f.title = poster.getAttribute('aria-label').replace(/^Play /, '');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
      frame.replaceChildren(f);
    });
  });
})();

// Workshop waiting list (Netlify Forms), confirmed in place.
(() => {
  const form = document.querySelector('form.ws-form');
  if (!form) return;
  const note = form.querySelector('.ws-note');
  if (new URLSearchParams(location.search).has('grazie')) { form.classList.add('is-done'); note.textContent = 'Fatto. Ti scrivo appena aprono le iscrizioni.'; }
  form.addEventListener('submit', e => {
    if (!form.checkValidity()) return;
    e.preventDefault();
    const btn = form.querySelector('button'); btn.disabled = true;
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
      .then(r => { if (!r.ok) throw new Error(r.status); form.classList.add('is-done'); note.textContent = 'Fatto. Ti scrivo appena aprono le iscrizioni.'; })
      .catch(() => { btn.disabled = false; note.textContent = 'Qualcosa non ha funzionato. Riprova, o scrivimi a mattia.giannattasio@gmail.com.'; });
  });
})();

// Footer details: the light in Parma now, the weather, time spent here, last update.
(() => {
  const light = document.querySelector('.sun-line'), wx = document.querySelector('.wx-line');
  const visit = document.querySelector('.visit-line'), upd = document.querySelector('.updated-line');
  const lat = 44.8015, lng = 10.3279, rad = Math.PI / 180;
  // Sun elevation (NOAA approximation) for the current moment in Parma.
  const elevation = now => {
    const start = Date.UTC(now.getUTCFullYear(), 0, 0), day = Math.floor((now - start) / 864e5);
    const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
    const g = 2 * Math.PI / 365 * (day - 1 + (hour - 12) / 24);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const tst = hour * 60 + eq + 4 * lng, ha = (tst / 4 - 180) * rad;
    const cosZ = Math.sin(lat * rad) * Math.sin(decl) + Math.cos(lat * rad) * Math.cos(decl) * Math.cos(ha);
    return 90 - Math.acos(Math.min(1, Math.max(-1, cosZ))) / rad;
  };
  const lightWord = e => e > 6 ? 'daylight' : e > -4 ? 'golden hour' : e > -6 ? 'blue hour' : 'night';
  if (light) { const set = () => { light.textContent = lightWord(elevation(new Date())); light.hidden = false; }; set(); setInterval(set, 60000); }
  // Weather from Open-Meteo (no key, no cookies), cached for 15 minutes.
  if (wx) {
    const words = c => c === 0 ? 'clear' : c <= 2 ? 'partly cloudy' : c === 3 ? 'cloudy' : c <= 48 ? 'fog' : c <= 57 ? 'drizzle' : c <= 67 ? 'rain' : c <= 77 ? 'snow' : c <= 82 ? 'showers' : c <= 86 ? 'snow' : 'storm';
    const show = d => { wx.textContent = `${Math.round(d.t)}°, ${words(d.c)}`; wx.hidden = false; };
    let cached = null; try { cached = JSON.parse(sessionStorage.getItem('mg-wx') || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.at < 9e5) show(cached);
    else fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=Europe%2FRome`)
      .then(r => r.ok ? r.json() : Promise.reject()).then(j => {
        const d = { t: j.current.temperature_2m, c: j.current.weather_code, at: Date.now() };
        try { sessionStorage.setItem('mg-wx', JSON.stringify(d)); } catch (e) {}
        show(d);
      }).catch(() => {});
  }
  // Time spent on the site in this visit, in primes.
  if (visit) {
    let start = Date.now(); try { start = +sessionStorage.getItem('mg-visit') || start; sessionStorage.setItem('mg-visit', start); } catch (e) {}
    const tick = () => { const s = Math.floor((Date.now() - start) / 1000), m = Math.floor(s / 60); visit.textContent = `You’ve been here ${m ? m + '′' : ''}${String(s % 60).padStart(m ? 2 : 1, '0')}″.`; visit.hidden = false; };
    tick(); setInterval(tick, 1000);
  }
  // Last update of the site.
  if (upd) {
    const d = new Date(upd.dataset.updated + 'T12:00:00'), days = Math.round((Date.now() - d) / 864e5);
    upd.textContent = `Updated ${days <= 0 ? 'today' : days === 1 ? 'yesterday' : days + ' days ago'}.`; upd.hidden = false;
  }
})();


// Small wonders (2026-11-20).
(() => {
  const ago = ms => { const m = Math.round(ms / 6e4), h = Math.round(ms / 36e5), d = Math.round(ms / 864e5);
    return m < 60 ? `${m} minutes ago` : h < 24 ? (h === 1 ? 'an hour ago' : `${h} hours ago`) : d === 1 ? 'yesterday' : `${d} days ago`; };
  // 1. Welcome back, between the two words of the name, after the name has arrived. Only for people who come back.
  let last = 0; try { last = +localStorage.getItem('mg-last-visit') || 0; } catch (e) {}
  const welcome = document.querySelector('.hero-welcome');
  if (welcome && last && Date.now() - last > 30 * 6e4) {
    const ms = Date.now() - last, h = ms / 36e5, d = Math.round(ms / 864e5);
    welcome.textContent = h < 12 ? 'back already? i like that.'
      : d <= 1 ? 'oh hi, you were here yesterday.'
      : d < 7 ? `oh hi again. it’s been ${d} days.`
      : d < 60 ? `look who’s back. ${Math.round(d / 7)} week${Math.round(d / 7) > 1 ? 's' : ''} since your last visit.`
      : 'it’s been a while. welcome back.';
    welcome.hidden = false;
  }
  const mark = () => { try { localStorage.setItem('mg-last-visit', Date.now()); } catch (e) {} };
  addEventListener('pagehide', mark); document.addEventListener('visibilitychange', () => { if (document.hidden) mark(); });
  // 2. The visitor's time next to Parma's.
  const you = document.querySelector('.fl-you');
  if (you) {
    const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fmt = tz => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(new Date());
    const set = () => {
      const a = fmt(here), b = fmt('Europe/Rome');
      you.textContent = a === b ? 'Same time where you are.' : `It’s ${a} where you are.`; you.hidden = false;
    };
    set(); setInterval(set, 30000);
  }
  // 3. Frame counter on the home film.
  const fr = document.querySelector('.hero-frames'), vid = document.querySelector('.hero-film video');
  if (fr && vid) {
    const fps = 30;
    const draw = () => { if (vid.duration) { fr.textContent = `frame ${Math.floor(vid.currentTime * fps) + 1} / ${Math.floor(vid.duration * fps)}`; fr.hidden = false; } };
    if ('requestVideoFrameCallback' in vid) { const loop = () => { draw(); vid.requestVideoFrameCallback(loop); }; vid.requestVideoFrameCallback(loop); }
    else { const loop = () => { draw(); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  }
})();


// More small wonders: right-click on work, the end of a film, copied words, late visitors.
(() => {
  const toast = (text, x, y) => {
    const t = document.createElement('div'); t.className = 'mg-toast'; t.textContent = text;
    if (x != null) { t.style.left = `${Math.min(x + 12, innerWidth - 180)}px`; t.style.top = `${y + 12}px`; t.classList.add('at-cursor'); }
    document.body.append(t); requestAnimationFrame(() => t.classList.add('is-in'));
    setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 400); }, 1800);
  };
  // 1. Right-click on a photo or a film: nothing is blocked, just a note.
  document.addEventListener('contextmenu', e => { if (e.target.closest('img, video, .work-image, .archive-thumb')) toast('this one’s mine (:', e.clientX, e.clientY); });
  // 2. A film watched to the end.
  document.querySelectorAll('.article-video video').forEach(v => v.addEventListener('ended', () => {
    const fig = v.closest('figure'); if (!fig || fig.querySelector('.film-thanks')) return;
    const p = document.createElement('p'); p.className = 'film-thanks'; p.textContent = 'you watched it till the end. thank you.'; fig.append(p);
  }));
  // 4. Copied words.
  document.addEventListener('copy', e => { if (e.target.closest && e.target.closest('input, textarea')) return; const sel = String(getSelection()); if (sel.trim().length > 12) toast('take it, just credit me (:'); });
  // 5. Late visitors (their own time, between midnight and 5).
  const late = document.querySelector('.fl-late');
  if (late) { const h = new Date().getHours(); if (h < 5) { late.textContent = 'it’s late where you are. thanks for spending it here.'; late.hidden = false; } }
})();


// Even more: slow down, the third visit, seconds on the clock.
(() => {
  const toast = text => { const t = document.createElement('div'); t.className = 'mg-toast'; t.textContent = text; document.body.append(t); requestAnimationFrame(() => t.classList.add('is-in')); setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 400); }, 2200); };
  // Scrolling the Work page too fast.
  if (document.querySelector('.work-filter')) {
    let lastY = scrollY, lastT = performance.now(), fast = 0, done = false;
    addEventListener('scroll', () => {
      if (done) return;
      const now = performance.now(), v = Math.abs(scrollY - lastY) / Math.max(now - lastT, 1);
      lastY = scrollY; lastT = now; fast = v > 4.5 ? fast + 1 : Math.max(0, fast - 1);
      if (fast > 6) { done = true; toast('slow down, these are films (:'); }
    }, { passive: true });
  }
  // Counting visits (one per browser session).
  let visits = 0;
  try { visits = +localStorage.getItem('mg-visits') || 0; if (!sessionStorage.getItem('mg-counted')) { visits += 1; localStorage.setItem('mg-visits', visits); sessionStorage.setItem('mg-counted', '1'); } } catch (e) {}
  const note = document.querySelector('.visit-note');
  if (note && visits >= 3) {
    const ord = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
    note.textContent = visits === 3 ? 'third time here. maybe we should talk.' : `${ord(visits)} time here. we should really talk.`;
    note.hidden = false;
  }
  // Seconds appear when you hover the clock.
  const sec = document.querySelector('.fl-sec');
  if (sec) { const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', second: '2-digit' }); const set = () => { sec.textContent = ':' + f.format(new Date()).padStart(2, '0'); }; set(); setInterval(set, 1000); }
})();
