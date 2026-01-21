// Medium Mirror Helper
// Rewrites Medium.com links to use freedium-mirror.cfd proxy
// Adds fallback link to original Medium URL

jQuery(document).ready(function($) {
  var FREEDIUM_BASE = 'https://freedium-mirror.cfd/';

  $('a[href*="medium.com"]').each(function() {
    var $link = $(this);
    var originalUrl = $link.attr('href');

    // Skip if already processed
    if ($link.hasClass('medium-mirror-processed')) {
      return;
    }

    // Mark as processed
    $link.addClass('medium-mirror-processed');

    // Rewrite href to Freedium proxy
    var proxyUrl = FREEDIUM_BASE + originalUrl;
    $link.attr('href', proxyUrl);

    // Create bracketed fallback link to original Medium
    var $fallback = $('<a>')
      .attr('href', originalUrl)
      .attr('title', 'View original on Medium.com')
      .attr('target', '_blank')
      .attr('rel', 'noopener noreferrer')
      .addClass('medium-original-link')
      .css({
        'margin-left': '0.4em',
        'font-size': '0.85em',
        'text-decoration': 'none',
        'opacity': '0.5'
      })
      .text('[Medium ↗]')
      .hover(
        function() {
          $(this).css('opacity', '1');
        },
        function() {
          $(this).css('opacity', '0.5');
        }
      );

    // Insert fallback after the link
    $link.after($fallback);
  });
});
