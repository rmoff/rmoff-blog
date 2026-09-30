// Light / dark / system theme switch.
//
// The inline script in baseof.html <head> resolves the saved choice before
// first paint and sets <html data-theme="light|dark" data-theme-pref="light|dark|system">.
// This file wires up the switch buttons (partials/theme-switch.html), keeps
// "system" in step with the OS, syncs other open tabs, and tells the giscus
// comments iframe to follow.
(function () {
  var STORAGE_KEY = 'theme'; // keep in sync with the inline script in baseof.html
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

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
      buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-theme-set') === pref ? 'true' : 'false');
    }
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
    if (button) choose(button.getAttribute('data-theme-set'));
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
