/**
 * Interesting Links — interactive filter
 *
 * Features:
 *   1. "Show top picks only" toggle hides non-🔥 list items
 *      (links to rmoff.net are always kept visible)
 */
(function () {
  'use strict';

  var article = document.querySelector('.article');
  if (!article) return;

  // ── Identify link sections ──────────────────────────────────────────
  // The il-header.adoc include renders as an admonitionblock.tip.
  // It may be a direct child of the article (most posts) or nested
  // inside a preceding sect1 (when there's a preamble section).
  // Every .sect1 after the tip marker is a "link section".
  var tipBlock = article.querySelector('.admonitionblock.tip');
  if (!tipBlock) return;

  // Find the starting point: either the containing sect1 or the tip itself
  var marker = tipBlock.closest('.sect1') || tipBlock;

  // Walk forward through siblings to collect link sections
  var linkSections = [];
  var cursor = marker.nextElementSibling;
  while (cursor) {
    if (cursor.classList.contains('sect1')) {
      linkSections.push(cursor);
    }
    cursor = cursor.nextElementSibling;
  }

  if (linkSections.length === 0) return;

  // ── Build toolbar ───────────────────────────────────────────────────
  var toolbar = document.createElement('div');
  toolbar.className = 'il-toolbar';
  toolbar.innerHTML =
    '<div class="il-toolbar-inner">' +
      '<label class="il-toggle" id="il-fire-toggle">' +
        '<input type="checkbox" id="il-fire-cb">' +
        '<span class="il-toggle-track">' +
          '<span class="il-toggle-knob"></span>' +
        '</span>' +
        '<span class="il-toggle-label">\uD83D\uDD25 Top picks only</span>' +
      '</label>' +
      '<span class="il-count" id="il-count">&nbsp;</span>' +
    '</div>';

  // Insert toolbar right before the first link section
  linkSections[0].parentNode.insertBefore(toolbar, linkSections[0]);

  // ── Mark link sections ─────────────────────────────────────────────
  linkSections.forEach(function (section) {
    section.dataset.ilSection = 'true';
  });

  // ── 🔥 filter logic ────────────────────────────────────────────────
  var fireCheckbox = document.getElementById('il-fire-cb');
  var countEl = document.getElementById('il-count');

  function applyFilter() {
    var fireOnly = fireCheckbox.checked;
    var totalVisible = 0;
    var totalAll = 0;

    linkSections.forEach(function (section) {
      var sectionBody = section.querySelector('.sectionbody');
      if (!sectionBody) return;

      // Get all <li> in this section
      var items = sectionBody.querySelectorAll('li');
      var sectionVisible = 0;

      items.forEach(function (li) {
        totalAll++;

        if (!fireOnly) {
          li.classList.remove('il-hidden');
          sectionVisible++;
          totalVisible++;
          return;
        }

        var text = li.textContent || '';
        var links = li.querySelectorAll('a');
        var isRmoff = false;
        for (var i = 0; i < links.length; i++) {
          if (links[i].href && links[i].href.indexOf('rmoff.net') !== -1) {
            isRmoff = true;
            break;
          }
        }
        var isFire = text.indexOf('\uD83D\uDD25') !== -1; // 🔥

        if (isFire || isRmoff) {
          li.classList.remove('il-hidden');
          sectionVisible++;
          totalVisible++;
        } else {
          li.classList.add('il-hidden');
        }
      });

      // Hide entire section if nothing visible
      if (fireOnly && sectionVisible === 0) {
        section.classList.add('il-section-empty');
      } else {
        section.classList.remove('il-section-empty');
      }

    });

    // Update count display
    if (fireOnly) {
      countEl.textContent = totalVisible + ' of ' + totalAll + ' links shown';
      countEl.classList.add('il-count-active');
    } else {
      countEl.textContent = totalAll + ' links';
      countEl.classList.remove('il-count-active');
    }

    toolbar.classList.toggle('il-fire-active', fireOnly);
  }

  fireCheckbox.addEventListener('change', applyFilter);

  // ── Sync state with URL query parameter and sessionStorage ─────────
  function updateUrl(fireOnly) {
    var url = new URL(window.location);
    if (fireOnly) {
      url.searchParams.set('top', '');
    } else {
      url.searchParams.delete('top');
    }
    history.replaceState(null, '', url);
  }

  // Initialise: ?top query param takes priority, then sessionStorage
  var params = new URLSearchParams(window.location.search);
  if (params.has('top')) {
    fireCheckbox.checked = true;
  } else {
    try {
      if (sessionStorage.getItem('il-fire-only') === 'true') {
        fireCheckbox.checked = true;
      }
    } catch (e) {}
  }

  fireCheckbox.addEventListener('change', function () {
    try { sessionStorage.setItem('il-fire-only', fireCheckbox.checked); } catch (e) {}
    updateUrl(fireCheckbox.checked);
  });

  // Apply filter on load and sync URL to match initial state
  applyFilter();
  updateUrl(fireCheckbox.checked);
})();
