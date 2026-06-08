/**
 * Old-school hit counter.
 *
 * Renders a RANDOMLY-chosen retro counter style (per page load) into every
 * `.hit-counter` element, showing the PostHog $pageview count fetched from the
 * popular-links Worker's `/views` route:
 *   data-scope="site"   -> whole-site total (homepage)
 *   data-path="/p/"      -> that page's views
 *   data-caption="off"   -> omit the text caption (e.g. when a section heading
 *                           already labels it)
 * Endpoint comes from window.hitCounterEndpoint. If unset / the fetch fails, the
 * counter hides itself (no error UI).
 *
 * Accessibility: the decorative digits are aria-hidden; the real number is
 * announced once via role="img" + aria-label on the container.
 */
(function () {
  'use strict';

  var endpoint = window.hitCounterEndpoint;
  var counters = document.querySelectorAll('.hit-counter');
  if (!endpoint || !counters.length) return;

  var STYLES = ['led', 'odometer', 'nixie', 'gif', 'banner'];
  var SINCE = 'since 13 Nov 2024';

  function pad7(n) { return String(n).padStart(7, '0'); }
  function comma(n) { return Number(n).toLocaleString('en-US'); }
  function cells(digits, tmpl) { return digits.split('').map(tmpl).join(''); }

  // Each renderer returns ONLY the visual digits (caption handled in the loop).
  var RENDER = {
    led: function (n) {
      return '<span class="hc-led-screen" aria-hidden="true">' +
        '<span class="hc-led-ghost">8888888</span>' +
        '<span class="hc-led-num">' + pad7(n) + '</span></span>';
    },
    odometer: function (n) {
      return '<span class="hc-odo" aria-hidden="true">' +
        cells(pad7(n), function (c) { return '<span>' + c + '</span>'; }) + '</span>';
    },
    nixie: function (n) {
      return '<span class="hc-nixie" aria-hidden="true">' +
        cells(pad7(n), function (c) { return '<span data-d="' + c + '">8</span>'; }) + '</span>';
    },
    gif: function (n) {
      return '<span class="hc-gif" aria-hidden="true">' +
        cells(pad7(n), function (c) { return '<span>' + c + '</span>'; }) + '</span>';
    },
    // Self-contained: the banner shows the number and its own "since" line.
    // Per-page counters can't honestly say "visitor #N" (that reads as site-wide),
    // so the wording switches on scope.
    banner: function (n, site) {
      var msg = site
        ? 'You are visitor #<b>' + comma(n) + '</b>'
        : 'This page has been viewed <b>' + comma(n) + '</b> times';
      return '<span class="hc-banner" aria-hidden="true">✦ ° ˖ ' + msg +
        ' ˖ ° ✦<small>~*~ ' + SINCE + ' ~*~</small></span>';
    },
  };

  function hide(el, why) {
    el.style.display = 'none';
    if (why && window.console && console.warn) console.warn('[hit-counter] ' + why);
  }

  counters.forEach(function (el) {
    var site = el.getAttribute('data-scope') === 'site';
    var path = el.getAttribute('data-path');
    if (!site && !path) { hide(el, 'no scope/path'); return; }
    var showCap = el.getAttribute('data-caption') !== 'off';

    var url = endpoint.replace(/\/$/, '') + '/views' +
      (site ? '' : '?path=' + encodeURIComponent(path));

    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var n = (data && Number(data.views)) || 0;
        var label = site ? 'site views' : 'page views';
        var style = STYLES[Math.floor(Math.random() * STYLES.length)];
        var html = RENDER[style](n, site);
        if (showCap && style !== 'banner') {
          // e.g. "page views · since 13 Nov 2024" (uppercased for the LED style)
          var caption = label + ' · ' + SINCE;
          var capText = (style === 'led') ? caption.toUpperCase() : caption;
          html += '<span class="hc-cap" aria-hidden="true">' + capText + '</span>';
        }
        el.innerHTML = html;
        el.setAttribute('data-style', style);
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label',
          comma(n) + (site ? ' site views' : ' views of this page') + ' since November 2024');
        el.classList.add('hit-counter--ready');
      })
      .catch(function () { hide(el, 'failed to load from ' + url); });
  });
})();
