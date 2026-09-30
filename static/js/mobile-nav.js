// Hamburger menu for <=1024px (partials/header.html). Toggles the drawer and
// keeps aria-expanded / the button label in step; Escape, a click outside,
// or widening past the breakpoint closes it.
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('mobile-nav');
  if (!toggle || !nav) return;

  function isOpen() {
    return nav.classList.contains('open');
  }

  function setOpen(open, returnFocus) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (!open && returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', function () {
    setOpen(!isOpen());
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) setOpen(false, true);
  });

  document.addEventListener('click', function (e) {
    if (isOpen() && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });

  // Matches the 1024px breakpoint in redesign.css where the desktop nav returns.
  if (window.matchMedia) {
    var desktop = window.matchMedia('(min-width: 1025px)');
    var onChange = function () { if (desktop.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }
})();
