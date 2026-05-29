// Medium Mirror Helper
// Rewrites Medium.com links to use a configurable mirror (e.g. freedium-mirror.cfd) proxy
// Adds fallback link to original Medium URL

// Capture currentScript at parse time — it is null inside DOMContentLoaded.
var FREEDIUM_BASE = (document.currentScript && document.currentScript.dataset.mirrorBase)
  || 'https://freedium-mirror.cfd/';
var FREEDIUM_HOST = (function() {
  try { return new URL(FREEDIUM_BASE).host; } catch (e) { return ''; }
})();

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href*="medium.com"]').forEach(function(link) {
    if (link.classList.contains('medium-mirror-processed')) return;
    link.classList.add('medium-mirror-processed');

    var originalUrl = link.getAttribute('href');

    // Skip if the link is already going through a translator or the configured mirror —
    // the user has chosen that path deliberately, don't second-guess it.
    if (/translate\.goog|translate\.kagi\.com/.test(originalUrl)) return;
    if (FREEDIUM_HOST && originalUrl.indexOf(FREEDIUM_HOST) !== -1) return;

    link.setAttribute('href', FREEDIUM_BASE + originalUrl);

    var fallback = document.createElement('a');
    fallback.setAttribute('href', originalUrl);
    fallback.setAttribute('title', 'View original on Medium.com');
    fallback.setAttribute('target', '_blank');
    fallback.setAttribute('rel', 'noopener noreferrer');
    fallback.className = 'medium-original-link';
    fallback.textContent = '[Medium \u2197]';
    fallback.style.cssText = 'margin-left:0.4em;font-size:0.85em;text-decoration:none;opacity:0.5';

    fallback.addEventListener('mouseenter', function() { this.style.opacity = '1'; });
    fallback.addEventListener('mouseleave', function() { this.style.opacity = '0.5'; });

    link.parentNode.insertBefore(fallback, link.nextSibling);
  });
});
