// Medium Mirror Helper
// Rewrites Medium.com links to use freedium-mirror.cfd proxy
// Adds small icon linking to original Medium URL

jQuery(document).ready(function($) {
  // Find all links to medium.com (including various subdomains)
  $('a[href*="medium.com"]').each(function() {
    var $link = $(this);
    var originalUrl = $link.attr('href');

    // Skip if already processed
    if ($link.hasClass('medium-mirror-processed')) {
      return;
    }

    // Mark as processed
    $link.addClass('medium-mirror-processed');

    // Rewrite href to proxy
    var proxyUrl = 'https://freedium-mirror.cfd/' + originalUrl;
    $link.attr('href', proxyUrl);

    // Create icon link to original
    var $icon = $('<a>')
      .attr('href', originalUrl)
      .attr('title', 'View original on Medium.com')
      .attr('target', '_blank')
      .attr('rel', 'noopener noreferrer')
      .addClass('medium-original-icon')
      .css({
        'margin-left': '0.25em',
        'font-size': '0.85em',
        'text-decoration': 'none',
        'display': 'inline-block',
        'vertical-align': 'super',
        'opacity': '0.6'
      })
      .text('ⓜ️')
      .hover(
        function() {
          $(this).css('opacity', '1');
        },
        function() {
          $(this).css('opacity', '0.6');
        }
      );

    // Insert icon after the link
    $link.after($icon);
  });
});
