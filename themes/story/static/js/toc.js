// Table of Contents functionality
document.addEventListener('DOMContentLoaded', function() {
  const tocElement = document.querySelector('.docs-toc');
  if (!tocElement) return;

  const tocLinks = tocElement.querySelectorAll('a[href^="#"]');
  const headings = [];

  // Build headings array from TOC links
  tocLinks.forEach(link => {
    const targetId = link.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      headings.push({
        id: targetId,
        element: targetElement,
        link: link
      });
    }
  });

  // Function to update active TOC link
  function updateActiveTocLink() {
    const scrollPosition = window.scrollY + 160; // Account for header height

    let activeHeading = null;
    for (let i = headings.length - 1; i >= 0; i--) {
      if (headings[i].element.offsetTop <= scrollPosition) {
        activeHeading = headings[i];
        break;
      }
    }

    // Remove active class from all links
    tocLinks.forEach(link => link.classList.remove('active'));

    // Add active class to current link
    if (activeHeading) {
      activeHeading.link.classList.add('active');
    }
  }

  // Debounced scroll handler
  let scrollTimeout;
  function debounceScroll() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(updateActiveTocLink, 10);
  }

  // Add scroll listener
  window.addEventListener('scroll', debounceScroll);

  // Initial call to set active link
  updateActiveTocLink();

      // Drawer functionality for smaller screens
    const drawer = document.querySelector('.docs-toc');
    const mobileLabel = document.querySelector('.toc-mobile-label');
    let isDrawerExpanded = false;

    // Function to position drawer and label
    function positionDrawer() {
        if (window.innerWidth <= 1199) {
            // Find the main content area to align with
            const mainContent = document.querySelector('.docs-content, main, .article, .content');
            const header = document.querySelector('header, .hero, .cover, .post-header, .page-header');

            if (mainContent && header) {
                const headerHeight = header.offsetHeight;
                const contentRect = mainContent.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const drawerHeight = Math.min(viewportHeight * 0.6, 500);

                // Position drawer to align with main content right edge, below header
                const drawerTop = Math.max(headerHeight + 50, (viewportHeight - drawerHeight) / 2);
                const drawerRight = Math.max(0, window.innerWidth - contentRect.right - 300); // 300px drawer + margin

                drawer.style.top = drawerTop + 'px';
                drawer.style.right = drawerRight + 'px';

                // Position label vertically in the middle of drawer area
                if (mobileLabel) {
                    mobileLabel.style.top = (drawerTop + drawerHeight / 2) + 'px';
                    // Keep right: 0 from CSS - don't override
                }

                // Show/hide without animation
                if (isDrawerExpanded) {
                    drawer.classList.add('expanded');
                } else {
                    drawer.classList.remove('expanded');
                }
            }
        } else {
            // Reset for desktop
            drawer.style.top = '';
            drawer.style.right = '';
            drawer.classList.remove('expanded');
            isDrawerExpanded = false;
            if (mobileLabel) {
                mobileLabel.style.top = '';
                // Don't reset right - let CSS handle it
            }
        }
    }

    // Position drawer on load and resize
    positionDrawer();
    window.addEventListener('resize', positionDrawer);

    // Handle clicks on the mobile label
    if (mobileLabel) {
        mobileLabel.addEventListener('click', function(e) {
            if (window.innerWidth <= 1199 && !isDrawerExpanded) {
                isDrawerExpanded = true;
                positionDrawer();
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    // Close drawer when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1199 && isDrawerExpanded &&
            !drawer.contains(e.target) && e.target !== mobileLabel) {
            isDrawerExpanded = false;
            positionDrawer();
        }
    });

  // Close drawer when clicking a link on mobile
  tocLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 1199 && isDrawerExpanded) {
        isDrawerExpanded = false;
        positionDrawer();
      }
    });
  });

  // Reset drawer state on window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 1199) {
      isDrawerExpanded = false;
    }
    positionDrawer();
  });
});

// Floating TOC toggle function
function toggleFloatingTOC() {
  var content = document.querySelector('.floating-toc-content');
  var button = document.querySelector('.floating-toc-button');

  if (content && button) {
    if (content.classList.contains('expanded')) {
      content.classList.remove('expanded');
      button.classList.remove('expanded');
    } else {
      content.classList.add('expanded');
      button.classList.add('expanded');
    }
  }
}
