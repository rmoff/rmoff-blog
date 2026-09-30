/**
 * ⌘K / Ctrl+K search palette.
 *
 * A <dialog> search overlay available on every page, built on the Pagefind JS
 * API. Everything heavy is lazy: the palette's CSS (data-css), the small
 * Hugo-built /search-palette.json (data-index: category lookup, recent posts,
 * top categories), the popular-posts Worker (data-top-posts) and Pagefind itself
 * are only fetched on first open, or when the pointer/focus lands on a Search
 * link. Until then this script only adds two document listeners.
 *
 * Progressive enhancement: Search links keep href="/search/"; modified clicks
 * (cmd/ctrl/shift/alt, middle button) and browsers without <dialog> just follow it.
 * On /search/ itself ([data-search-page]) ⌘K focuses the page's own input instead.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script || typeof HTMLDialogElement !== 'function') return;

  var CSS_URL = script.getAttribute('data-css');
  var INDEX_URL = script.getAttribute('data-index') || '/search-palette.json';
  var SEARCH_URL = script.getAttribute('data-search-url') || '/search/';
  var TOP_POSTS_URL = script.getAttribute('data-top-posts') || '';
  var PAGEFIND_URL = '/pagefind/pagefind.js';

  var EXCERPT_WORDS = 25;   // keep in sync with layouts/_default/search.html
  var MAX_POSTS = 8;
  var MAX_CATS = 8;
  var MAX_RECENT = 5;
  var MIN_QUERY = 2;
  var DEBOUNCE_MS = 120;

  var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  var isApple = /mac|iphone|ipad|ipod/i.test(platform);
  if (!isApple) {
    document.querySelectorAll('.nav-kbd').forEach(function (k) { k.textContent = 'Ctrl K'; });
  }

  // ---------------------------------------------------------------- loaders

  var cssP, dataP, pagefindP, topPostsP, pagefindReady = false;

  function loadCSS() {
    if (!cssP) {
      cssP = new Promise(function (resolve) {
        if (!CSS_URL) return resolve();
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CSS_URL;
        link.onload = link.onerror = function () { resolve(); };
        document.head.appendChild(link);
        setTimeout(resolve, 2000); // never block opening on a slow stylesheet
      });
    }
    return cssP;
  }

  function loadData() {
    if (!dataP) {
      dataP = fetch(INDEX_URL)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (d) {
          var lookup = new Map();
          (d.categories || []).forEach(function (c) { lookup.set(String(c.n).toLowerCase(), c); });
          d.lookup = lookup;
          return d;
        })
        .catch(function () { return null; });
    }
    return dataP;
  }

  function loadPagefind() {
    if (!pagefindP) {
      pagefindP = import(PAGEFIND_URL)
        .then(async function (pf) {
          await pf.options({ excerptLength: EXCERPT_WORDS });
          // Initialises Pagefind and loads the (small) filter index. Without this,
          // search results come back with empty filter counts, so there would be
          // no matching categories. (On /search/, PagefindUI does the same.)
          await pf.filters();
          pagefindReady = true;
          return pf;
        })
        .catch(function () { return null; }); // dev server / index missing
    }
    return pagefindP;
  }

  // Same Worker + limit as the sidebar widget (static/js/top-posts.js), so the
  // edge cache (keyed by limit) and the browser's HTTP cache are shared.
  function loadTopPosts() {
    if (!topPostsP) {
      topPostsP = !TOP_POSTS_URL ? Promise.resolve([]) :
        fetch(TOP_POSTS_URL.replace(/\/$/, '') + '/top-posts?limit=10')
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(function (d) { return ((d && d.posts) || []).slice(0, MAX_RECENT); })
          .catch(function () { return []; });
    }
    return topPostsP;
  }

  function prewarm() { loadCSS(); loadData(); loadPagefind(); }

  // ---------------------------------------------------------------- helpers

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function catURL(slug) { return '/categories/' + slug + '/'; }

  function allResultsURL(q) { return SEARCH_URL + (q ? '?q=' + encodeURIComponent(q) : ''); }

  // Categories of the matching posts (Pagefind filter counts), merged
  // case-insensitively ("obiee" + "OBIEE") and mapped to the Hugo term page.
  // Categories whose name contains the query rank first, then by count.
  function matchCategories(filters, data, q) {
    if (!filters || !filters.category || !data) return [];
    var merged = new Map();
    Object.keys(filters.category).forEach(function (value) {
      var n = filters.category[value];
      var key = value.toLowerCase();
      var hit = data.lookup.get(key);
      if (!n || !hit) return;
      var m = merged.get(key) || { name: value, top: 0, url: catURL(hit.s), count: 0 };
      if (n > m.top) { m.name = value; m.top = n; } // show the most-used spelling, as written in front matter
      m.count += n;
      merged.set(key, m);
    });
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    function nameScore(c) {
      var name = c.name.toLowerCase();
      return words.every(function (w) { return name.indexOf(w) !== -1; }) ? 1 : 0;
    }
    return Array.from(merged.values())
      .sort(function (a, b) { return (nameScore(b) - nameScore(a)) || (b.count - a.count); })
      .slice(0, MAX_CATS);
  }

  function pageSearchInput() {
    return document.querySelector('[data-search-page] .pagefind-ui__search-input');
  }

  // ---------------------------------------------------------------- dialog

  var dlg, input, list, msg, allLink, statusEl;
  var options = [], active = -1, lastFocus = null, seq = 0, timer = null, opening = false;
  var currentQuery = '';

  var SEARCH_ICON = '<svg class="sp-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'sp';
    dlg.setAttribute('aria-label', 'Search the blog');
    dlg.innerHTML =
      '<div class="sp-panel">' +
        '<div class="sp-head">' + SEARCH_ICON +
          '<input class="sp-input" type="text" role="combobox" aria-expanded="false" aria-controls="sp-list"' +
          ' aria-autocomplete="list" aria-label="Search posts and categories" placeholder="Search posts and categories…"' +
          ' autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">' +
          '<button type="button" class="sp-close" aria-label="Close search">Close</button>' +
        '</div>' +
        '<div class="sp-body">' +
          '<div class="sp-list" id="sp-list" role="listbox" aria-label="Search suggestions"></div>' +
          '<p class="sp-msg" hidden></p>' +
        '</div>' +
        '<div class="sp-foot">' +
          '<a class="sp-all" href="' + esc(SEARCH_URL) + '">Open the search page →</a>' +
          '<span class="sp-hints" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> navigate <kbd>↵</kbd> open <kbd>esc</kbd> close</span>' +
        '</div>' +
        '<div class="sp-status" role="status" aria-live="polite"></div>' +
      '</div>';
    document.body.appendChild(dlg);

    input = dlg.querySelector('.sp-input');
    list = dlg.querySelector('.sp-list');
    msg = dlg.querySelector('.sp-msg');
    allLink = dlg.querySelector('.sp-all');
    statusEl = dlg.querySelector('.sp-status');

    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { run(input.value.trim()); }, DEBOUNCE_MS);
    });
    input.addEventListener('keydown', onKeydown);

    // Mouse hover syncs the active item (mousemove, so a list re-rendering
    // under a stationary pointer doesn't steal the keyboard selection).
    list.addEventListener('mousemove', function (e) {
      var opt = e.target.closest('[role="option"]');
      if (opt) setActive(options.indexOf(opt), false);
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) { dlg.close(); return; }                       // backdrop
      if (e.target.closest('.sp-close')) { dlg.close(); return; }
      var a = e.target.closest('a[href]');
      if (a && e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) dlg.close();
    });
    dlg.addEventListener('close', function () {
      document.documentElement.classList.remove('sp-open');
      if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    });

    renderEmpty();
  }

  async function open() {
    var own = pageSearchInput();
    if (own) { own.focus(); own.select(); return; }
    if (document.querySelector('[data-search-page]')) return; // search page UI still booting
    if (opening || (dlg && dlg.open)) return;
    opening = true;
    lastFocus = document.activeElement;
    // Opened from the hamburger drawer: close it via its own toggle (keeps
    // aria-expanded and the icon in step; js/mobile-nav.js) and return focus
    // to the toggle afterwards, since the drawer link will be hidden.
    var navToggle = document.querySelector('.nav-toggle[aria-expanded="true"]');
    if (navToggle) { navToggle.click(); lastFocus = navToggle; }
    prewarm();
    await loadCSS();
    if (!dlg) build();
    document.documentElement.classList.add('sp-open');
    dlg.showModal();
    opening = false;
    input.focus();
    input.select();
  }

  function onKeydown(e) {
    if (e.isComposing) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!options.length) return;
      var step = e.key === 'ArrowDown' ? 1 : -1;
      var next = active === -1 ? (step === 1 ? 0 : options.length - 1)
                               : (active + step + options.length) % options.length;
      setActive(next, true);
    } else if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        go(allLink.href);
      } else if (active !== -1 && options[active]) {
        e.preventDefault();
        go(options[active].href);
      }
    }
  }

  function go(href) {
    dlg.close();
    window.location.href = href;
  }

  function setActive(i, scroll) {
    if (i === active && i !== -1) return;
    if (options[active]) {
      options[active].classList.remove('is-active');
      options[active].setAttribute('aria-selected', 'false');
    }
    active = i;
    var opt = options[i];
    if (opt) {
      opt.classList.add('is-active');
      opt.setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', opt.id);
      if (scroll) opt.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  // ---------------------------------------------------------------- rendering

  function group(id, label, body, cls) {
    return '<div class="sp-group ' + (cls || '') + '" role="group" aria-labelledby="sp-g-' + id + '">' +
      '<div class="sp-group-label" id="sp-g-' + id + '" role="presentation">' + esc(label) + '</div>' +
      body + '</div>';
  }

  function chips(cats, withCount) {
    return '<div class="sp-chips" role="none">' + cats.map(function (c) {
      return '<a class="sp-opt sp-chip" role="option" aria-selected="false" tabindex="-1" href="' + esc(c.url) + '">' +
        esc(c.name) + (withCount ? ' <span class="sp-chip-count">' + c.count + '</span>' : '') + '</a>';
    }).join('') + '</div>';
  }

  function postRow(p) {
    return '<a class="sp-opt sp-post" role="option" aria-selected="false" tabindex="-1" href="' + esc(p.url) + '">' +
      '<span class="sp-post-title">' + esc(p.title) + '</span>' +
      (p.date ? '<span class="sp-post-date">' + esc(p.date) + '</span>' : '') +
      (p.excerpt ? '<span class="sp-post-excerpt">' + p.excerpt + '</span>' : '') + // Pagefind excerpts are HTML-safe (with <mark>)
      '</a>';
  }

  function commit(html, message, defaultActive) {
    list.innerHTML = html;
    options = Array.prototype.slice.call(list.querySelectorAll('[role="option"]'));
    options.forEach(function (o, i) { o.id = 'sp-o-' + i; });
    active = -1;
    setActive(defaultActive == null ? -1 : defaultActive, false);
    input.setAttribute('aria-expanded', options.length ? 'true' : 'false');
    list.hidden = !options.length;
    msg.hidden = !message;
    msg.textContent = message || '';
    list.scrollTop = 0;
  }

  function setFooter(q, total) {
    allLink.href = allResultsURL(q);
    allLink.textContent = q && total ? 'See all ' + total + ' result' + (total === 1 ? '' : 's') + ' →'
                                     : 'Open the search page →';
    allLink.hidden = !!q && !total;
  }

  function announce(text) { statusEl.textContent = text; }

  async function renderEmpty() {
    var my = ++seq;
    currentQuery = '';
    setFooter('', 0);
    var data = await loadData();
    var top = await loadTopPosts();
    if (my !== seq) return;
    var html = '';
    if (data && data.recent && data.recent.length) {
      html += group('recent', 'Recent posts', data.recent.slice(0, MAX_RECENT).map(function (p) {
        return postRow({ url: p.u, title: p.t, date: p.d });
      }).join(''));
    }
    if (top.length) {
      html += group('popular', 'Popular posts', top.map(function (p) {
        return postRow({ url: p.url, title: p.title || p.url });
      }).join(''));
    }
    if (data && data.top && data.top.length) {
      html += group('topcats', 'Top categories', chips(data.top.map(function (c) {
        return { name: c.n, url: catURL(c.s) };
      }), false), 'sp-group-cats');
    }
    commit(html, html ? '' : 'Start typing to search.', -1);
    announce('');
  }

  async function run(q) {
    if (q === currentQuery) return;
    if (q.length < MIN_QUERY) { renderEmpty(); return; }
    var my = ++seq;
    currentQuery = q;
    if (!pagefindReady) { msg.hidden = false; msg.textContent = 'Loading search…'; }
    var pf = await loadPagefind();
    if (my !== seq) return;
    if (!pf) {
      setFooter(q, 0);
      commit('', 'Search is unavailable right now (the search index didn’t load).', -1);
      announce('Search is unavailable');
      return;
    }
    var search, posts, data;
    try {
      search = await pf.search(q);
      posts = await Promise.all(search.results.slice(0, MAX_POSTS).map(function (r) { return r.data(); }));
      data = await loadData();
    } catch (err) {
      search = null;
    }
    if (my !== seq) return;
    if (!search) {
      setFooter(q, 0);
      commit('', 'Something went wrong running that search.', -1);
      return;
    }
    var total = search.results.length;
    setFooter(q, total);
    if (!total) {
      commit('', 'No results for “' + q + '”.', -1);
      announce('No results');
      return;
    }
    var cats = matchCategories(search.filters, data, q);
    var html = '';
    if (cats.length) html += group('cats', 'Categories', chips(cats, true), 'sp-group-cats');
    html += group('posts', 'Posts', posts.map(function (r) {
      var meta = r.meta || {};
      var date = meta.date && meta.date.indexOf('0001') === -1 ? meta.date : '';
      return postRow({ url: r.url, title: meta.title || r.url, date: date, excerpt: r.excerpt });
    }).join(''));
    // Default to the top post, not the first category chip: Enter after typing
    // should open the best-matching article. ArrowUp reaches the categories.
    commit(html, '', cats.length);
    announce(total + ' result' + (total === 1 ? '' : 's') +
      (cats.length ? ', ' + cats.length + ' matching categor' + (cats.length === 1 ? 'y' : 'ies') : ''));
  }

  // ---------------------------------------------------------------- wiring

  document.addEventListener('keydown', function (e) {
    if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || (e.key !== 'k' && e.key !== 'K')) return;
    e.preventDefault();
    if (dlg && dlg.open) dlg.close(); else open();
  });

  function searchLink(e) { return e.target.closest && e.target.closest('a[data-search-palette]'); }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!searchLink(e)) return;
    e.preventDefault();
    open();
  });
  ['pointerover', 'focusin', 'touchstart'].forEach(function (type) {
    document.addEventListener(type, function (e) { if (searchLink(e)) prewarm(); }, { passive: true });
  });
})();
