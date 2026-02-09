// Medium Mirror Helper
// Rewrites Medium.com links to use freedium-mirror.cfd proxy
// Adds fallback link to original Medium URL

document.addEventListener('DOMContentLoaded', function() {
  var FREEDIUM_BASE = 'https://freedium-mirror.cfd/';

  document.querySelectorAll('a[href*="medium.com"]').forEach(function(link) {
    if (link.classList.contains('medium-mirror-processed')) return;
    link.classList.add('medium-mirror-processed');

    var originalUrl = link.getAttribute('href');
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
