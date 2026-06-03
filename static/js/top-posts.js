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
  function hide(el) { (el.closest('.sidebar-section') || el).style.display = 'none'; }

  widgets.forEach(function (el) {
    var limit = parseInt(el.getAttribute('data-limit'), 10) || 10;
    var url = endpoint.replace(/\/$/, '') + '/top-posts?limit=' + limit;

    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var posts = (data && data.posts) || [];
        if (!posts.length) { hide(el); return; }
        var html = '<ul class="top-posts-list">';
        posts.forEach(function (p) {
          var t = escapeHtml(p.title || p.url);
          html += '<li><a href="' + escapeHtml(p.url) + '" title="' + t + '">' + t + '</a></li>';
        });
        html += '</ul>';
        el.innerHTML = html;
      })
      .catch(function () { hide(el); });
  });
})();
