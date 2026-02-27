/**
 * Interesting Links — interactive filter & collapse
 *
 * Features:
 *   1. Each h2 section is collapsible (click the heading)
 *   2. "Show top picks only" toggle hides non-🔥 list items
 *      (links to rmoff.net are always kept visible)
 *   3. Collapse-all / Expand-all buttons
 *   4. Section count badges update when filter is active
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

  // ── Make sections collapsible ───────────────────────────────────────
  linkSections.forEach(function (section) {
    var h2 = section.querySelector('h2');
    var body = section.querySelector('.sectionbody');
    if (!h2 || !body) return;

    // Add collapse chevron
    var chevron = document.createElement('span');
    chevron.className = 'il-chevron';
    chevron.innerHTML = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>';
    h2.insertBefore(chevron, h2.firstChild);

    // Count badge + show-all wrapper
    var meta = document.createElement('span');
    meta.className = 'il-section-meta';

    var badge = document.createElement('span');
    badge.className = 'il-section-count';

    var showAll = document.createElement('a');
    showAll.className = 'il-show-all';
    showAll.textContent = 'show all';
    showAll.href = '#';
    showAll.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      fireCheckbox.checked = false;
      try { sessionStorage.setItem('il-fire-only', 'false'); } catch (ex) {}
      applyFilter();
    });

    meta.appendChild(badge);
    meta.appendChild(showAll);
    h2.appendChild(meta);

    section.dataset.ilSection = 'true';

    h2.style.cursor = 'pointer';
    h2.addEventListener('click', function (e) {
      // Don't toggle if they clicked the anchor link or section meta
      if (e.target.closest('.headline-hash')) return;
      if (e.target.closest('.il-section-meta')) return;
      section.classList.toggle('il-collapsed');
    });

    updateSectionBadge(section);
  });

  function updateSectionBadge(section) {
    var badge = section.querySelector('.il-section-count');
    var showAll = section.querySelector('.il-show-all');
    if (!badge) return;

    var allItems = section.querySelectorAll('.sectionbody li');
    var visibleItems = 0;
    allItems.forEach(function (li) {
      if (!li.classList.contains('il-hidden')) {
        visibleItems++;
      }
    });

    var totalItems = allItems.length;
    var isFiltered = document.getElementById('il-fire-cb').checked;

    if (isFiltered) {
      badge.textContent = visibleItems + '/' + totalItems;
      badge.classList.add('il-filtered');
      badge.style.display = '';
      if (showAll) showAll.style.display = '';
    } else {
      badge.textContent = '';
      badge.classList.remove('il-filtered');
      badge.style.display = 'none';
      if (showAll) showAll.style.display = 'none';
    }
  }

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

      // Auto-expand sections that have visible items when filtering
      if (fireOnly && sectionVisible > 0) {
        section.classList.remove('il-collapsed');
      }

      updateSectionBadge(section);
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

  // ── Persist toggle state in session ─────────────────────────────────
  try {
    var saved = sessionStorage.getItem('il-fire-only');
    if (saved === 'true') {
      fireCheckbox.checked = true;
    }
    fireCheckbox.addEventListener('change', function () {
      sessionStorage.setItem('il-fire-only', fireCheckbox.checked);
    });
  } catch (e) {
    // sessionStorage not available
  }

  // Show count on load (and apply filter if restored from session)
  applyFilter();
})();
