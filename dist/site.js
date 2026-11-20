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
  name.setAttribute('aria-label', name.textContent.replace(/\s+/g, ' ').trim());
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
        .then(() => { form.classList.add('is-done'); note.textContent = 'Almost there. Check your inbox to confirm.'; })
        .catch(() => { btn.disabled = false; form.submit(); });
    });
  });
})();

// Copy the email on devices with a mouse; phones open the mail app.
(() => {
  document.querySelectorAll('[data-copy]').forEach(link => {
    const status = link.parentElement.querySelector('.copy-status');
    if (!window.matchMedia('(pointer: fine)').matches || !navigator.clipboard) return;
    if (status) status.textContent = 'Click to copy';
    link.addEventListener('click', e => {
      e.preventDefault();
      navigator.clipboard.writeText(link.dataset.copy).then(() => {
        if (status) { status.textContent = 'Copied. Talk soon.'; setTimeout(() => { status.textContent = 'Click to copy'; }, 2600); }
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
