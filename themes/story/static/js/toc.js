// Back to top button functionality
document.addEventListener('DOMContentLoaded', function() {
  var backToTopButton = document.getElementById('back_to_top');
  if (backToTopButton) {
    backToTopButton.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Highlight TOC items as user scrolls
  var headings = document.querySelectorAll('h2, h3, h4, h5, h6');
  var tocLinks = document.querySelectorAll('.docs-toc a');

  function highlightTOC() {
    if (!headings.length || !tocLinks.length) return;

    // Get current scroll position
    var scrollPosition = window.scrollY;

    // Find the last heading that's above the current scroll position
    var currentHeading = null;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].offsetTop < scrollPosition + 100) {
        currentHeading = headings[i];
      } else {
        break;
      }
    }

    // Remove active class from all TOC links
    tocLinks.forEach(function(link) {
      link.classList.remove('active');
    });

    // Add active class to current TOC link
    if (currentHeading) {
      var id = currentHeading.id;
      var activeLink = document.querySelector('.docs-toc a[href="#' + id + '"]');
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }
  }

  // Run on page load and scroll
  highlightTOC();
  window.addEventListener('scroll', highlightTOC);
});
