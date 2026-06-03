/**
 * Most-read posts — sidebar widget.
 *
 * Fetches the top posts by PostHog $pageview count from the popular-links Worker
 * `/top-posts` route and renders them into every `.top-posts` element, reusing
 * the `.popular-links-*` styling (rank, proportional bar, link, count).
 * Endpoint: window.topPostsEndpoint. Hides its sidebar section on failure/empty.
 */
(function () {
  'use strict';

  var endpoint = window.topPostsEndpoint;
  var widgets = document.querySelectorAll('.top-posts');
  if (!endpoint || !widgets.length) return;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function comma(n) { return (Number(n) || 0).toLocaleString('en-US'); }
  function hide(el) { (el.closest('.sidebar-section') || el).style.display = 'none'; }

  widgets.forEach(function (el) {
    var limit = parseInt(el.getAttribute('data-limit'), 10) || 10;
    var url = endpoint.replace(/\/$/, '') + '/top-posts?limit=' + limit;

    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var posts = (data && data.posts) || [];
        if (!posts.length) { hide(el); return; }
        var max = Number(posts[0].views) || 1;
        var html = '<ol class="popular-links-list">';
        posts.forEach(function (p, i) {
          var pct = Math.max(2, Math.round((Number(p.views) || 0) / max * 100));
          html +=
            '<li class="popular-links-item">' +
              '<span class="popular-links-bar" style="width:' + pct + '%"></span>' +
              '<span class="popular-links-rank">' + (i + 1) + '</span>' +
              '<a class="popular-links-link" href="' + escapeHtml(p.url) + '">' +
                escapeHtml(p.title || p.url) + '</a>' +
              '<span class="popular-links-clicks"><b>' + comma(p.views) + '</b> views</span>' +
            '</li>';
        });
        html += '</ol><p class="top-posts-note">most-read since 13 Nov 2024</p>';
        el.innerHTML = html;
      })
      .catch(function () { hide(el); });
  });
})();
