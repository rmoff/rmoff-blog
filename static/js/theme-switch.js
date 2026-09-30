// Light / dark / system theme switch.
//
// The inline script in baseof.html <head> resolves the saved choice before
// first paint and sets <html data-theme="light|dark" data-theme-pref="light|dark|system">.
// This file wires up the header menu (partials/theme-menu.html) and the
// mobile nav buttons (partials/theme-switch.html), keeps "system" in step
// with the OS, syncs other open tabs, and tells the giscus iframe to follow.
(function () {
  var STORAGE_KEY = 'theme'; // keep in sync with the inline script in baseof.html
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var LABELS = { light: 'Light', dark: 'Dark', system: 'System' };
  var menuButton = document.querySelector('.theme-menu-button');
  var menu = document.getElementById('theme-menu-list');

  function normalise(pref) {
    return pref === 'light' || pref === 'dark' ? pref : 'system';
  }

  function currentPref() {
    return normalise(root.getAttribute('data-theme-pref'));
  }

  function resolve(pref) {
    if (pref === 'system') return media && media.matches ? 'dark' : 'light';
    return pref;
  }

  function updateGiscus(theme) {
    var frame = document.querySelector('iframe.giscus-frame');
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ giscus: { setConfig: { theme: theme } } }, 'https://giscus.app');
  }

  function updateButtons(pref) {
    var buttons = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute('data-theme-set') === pref ? 'true' : 'false';
      // Menu items are radios; the mobile row uses toggle buttons.
      buttons[i].setAttribute(buttons[i].getAttribute('role') === 'menuitemradio' ? 'aria-checked' : 'aria-pressed', on);
    }
    if (menuButton) {
      var label = 'Theme: ' + LABELS[pref];
      menuButton.setAttribute('aria-label', label);
      menuButton.setAttribute('title', label);
    }
  }

  // --- Header menu ---------------------------------------------------------

  function menuItems() {
    return menu ? Array.prototype.slice.call(menu.querySelectorAll('[role="menuitemradio"]')) : [];
  }

  function isMenuOpen() {
    return !!menu && !menu.hidden;
  }

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    var items = menuItems();
    var checked = items.filter(function (el) { return el.getAttribute('aria-checked') === 'true'; })[0];
    (checked || items[0]).focus();
  }

  function closeMenu(returnFocus) {
    if (!isMenuOpen()) return;
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuButton.focus();
  }

  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      if (isMenuOpen()) closeMenu(false);
      else openMenu();
    });

    menuButton.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openMenu();
      }
    });

    menu.addEventListener('keydown', function (e) {
      var items = menuItems();
      var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); }
      else if (e.key === 'Tab') { closeMenu(false); }
    });

    // Click anywhere else closes it.
    document.addEventListener('click', function (e) {
      if (isMenuOpen() && !e.target.closest('.theme-menu')) closeMenu(false);
    });
  }

  function apply(pref) {
    var theme = resolve(pref);
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-theme-pref', pref);
    updateButtons(pref);
    updateGiscus(theme);
  }

  function choose(pref) {
    pref = normalise(pref);
    try {
      if (pref === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, pref);
    } catch (e) {}
    apply(pref);
  }

  document.addEventListener('click', function (e) {
    var button = e.target.closest && e.target.closest('[data-theme-set]');
    if (!button) return;
    choose(button.getAttribute('data-theme-set'));
    if (menu && menu.contains(button)) closeMenu(true);
  });

  // "system" follows the OS live.
  if (media) {
    var onChange = function () {
      if (currentPref() === 'system') apply('system');
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }

  // giscus reads its theme when its iframe is created (single.html). If the
  // choice changed before the iframe finished loading, correct it on the
  // first message giscus sends back.
  var giscusSynced = false;
  window.addEventListener('message', function (e) {
    if (giscusSynced || e.origin !== 'https://giscus.app' || !e.data || !e.data.giscus) return;
    giscusSynced = true;
    var frame = document.querySelector('iframe.giscus-frame');
    var theme = resolve(currentPref());
    if (frame && frame.src.indexOf('theme=' + theme) === -1) updateGiscus(theme);
  });

  // Another tab changed the choice.
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY || e.key === null) apply(normalise(e.newValue));
  });

  updateButtons(currentPref());
})();
