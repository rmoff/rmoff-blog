/**
 * Popular links — renders the most-clicked outbound links from the
 * Interesting Links series.
 *
 * Data comes from the `popular-links` Cloudflare Worker (which queries PostHog
 * `il_link_clicked` events). Every element matching `.popular-links` on the page
 * is populated. Per-element config via data attributes:
 *
 *   data-limit        number of links to show       (default 10)
 *   data-heading      heading text                  (omitted → no heading)
 *   data-heading-note small italic note after the heading (optional)
 *   data-path         scope to one post page        (omitted → site-wide)
 *   data-endpoint     override the Worker endpoint  (default window.popularLinksEndpoint)
 *
 * If unconfigured, empty, or the fetch fails, the widget hides itself (no error UI).
 */
(function () {
  'use strict';

  var containers = document.querySelectorAll('.popular-links');
  if (!containers.length) return;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function domainOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (e) { return ''; }
  }

  function headingHtml(container) {
    var heading = container.getAttribute('data-heading');
    if (!heading) return '';
    var note = container.getAttribute('data-heading-note');
    return '<h2 class="popular-links-heading">' + escapeHtml(heading) +
      (note ? ' <em class="popular-links-heading-note">' + escapeHtml(note) + '</em>' : '') +
      '</h2>';
  }

  function render(container, links) {
    if (!links.length) {
      // Nothing clicked yet (e.g. an older post pre-dating tracking) — stay quiet.
      container.style.display = 'none';
      return;
    }
    var html = headingHtml(container);
    var max = Number(links[0].clicks) || 1; // links are sorted desc, so the first is the max
    html += '<ol class="popular-links-list">';
    links.forEach(function (item, i) {
      var domain = domainOf(item.url);
      var label = (item.text && item.text.trim()) || domain || item.url;
      var clicks = Number(item.clicks) || 0;
      var pct = Math.max(2, Math.round((clicks / max) * 100)); // min sliver so the smallest still shows
      html +=
        '<li class="popular-links-item">' +
          '<span class="popular-links-bar" style="width:' + pct + '%"></span>' +
          '<span class="popular-links-rank">' + (i + 1) + '</span>' +
          '<a class="popular-links-link" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener">' +
            escapeHtml(label) +
            (domain ? ' <span class="popular-links-domain">' + escapeHtml(domain) + '</span>' : '') +
          '</a>' +
          '<span class="popular-links-clicks"><b>' + clicks + '</b> clicks</span>' +
        '</li>';
    });
    html += '</ol>';
    container.innerHTML = html;
  }

  // The widget is a non-essential enhancement: if it can't load (not configured,
  // Worker down, network/CORS error, empty), hide it entirely rather than show
  // any error UI to readers. A console warning is left for debugging.
  function hide(container, reason) {
    container.style.display = 'none';
    if (reason && window.console && console.warn) console.warn('[popular-links] ' + reason);
  }

  containers.forEach(function (container) {
    var endpoint = container.getAttribute('data-endpoint') || window.popularLinksEndpoint;
    if (!endpoint) {
      hide(container, 'endpoint not configured');
      return;
    }
    var limit = parseInt(container.getAttribute('data-limit'), 10) || 10;
    var path = container.getAttribute('data-path');
    var url = endpoint + '?limit=' + limit + (path ? '&path=' + encodeURIComponent(path) : '');

    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) { render(container, (data && data.links) || []); })
      .catch(function () { hide(container, 'failed to load from ' + endpoint); });
  });
})();
