// Lightbox for article images displayed smaller than their natural size.
// A native <dialog> (like the search palette), so the browser keeps Tab inside it
// and makes the page behind inert. Size is CSS: fitted to the screen on desktop,
// natural size with panning on touch screens and narrow windows.
(function () {
  var overlay = null;  // the open viewer, still set while it fades out
  var opener = null;   // the image that opened it, which gets focus back
  var stopTrackingZoom = null;

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function finishClose(el) {
    if (el !== overlay) return;
    overlay = null;
    if (el.open) el.close();
    if (el.parentNode) el.parentNode.removeChild(el);
    var root = document.documentElement;
    root.classList.remove('lightbox-open');
    root.style.paddingRight = '';
    if (stopTrackingZoom) stopTrackingZoom();
    stopTrackingZoom = null;
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    opener = null;
  }

  function closeLightbox() {
    if (!overlay) return;
    var el = overlay;
    // No fade-out under reduced motion (CSS drops the transition), so remove at once
    if (prefersReducedMotion()) {
      finishClose(el);
      return;
    }
    el.style.opacity = '0';
    setTimeout(function () {
      finishClose(el);
    }, 200);
  }

  // Pinch zoom moves the visible area but not position: fixed things, so without
  // this a zoomed-in reader can lose the close button. Pins it to the visible
  // top right corner, at its normal size.
  function trackZoom(close) {
    var view = window.visualViewport;
    if (!view) return;
    function place() {
      var x = view.offsetLeft + view.width - document.documentElement.clientWidth;
      close.style.transform = 'translate(' + x + 'px, ' + view.offsetTop + 'px) scale(' + 1 / view.scale + ')';
    }
    view.addEventListener('resize', place);
    view.addEventListener('scroll', place);
    stopTrackingZoom = function () {
      view.removeEventListener('resize', place);
      view.removeEventListener('scroll', place);
    };
    place();
  }

  function canPan(el) {
    return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
  }

  function openLightbox(source) {
    if (overlay) return;
    var el = document.createElement('dialog');
    el.className = 'lightbox-overlay';
    el.setAttribute('aria-label', 'Enlarged image');

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'lightbox-close';
    close.setAttribute('aria-label', 'Close image viewer');
    close.textContent = '×';

    var img = document.createElement('img');
    img.src = source.src;
    img.alt = source.alt;
    img.className = 'lightbox-img';

    el.appendChild(close);
    el.appendChild(img);
    document.body.appendChild(el);

    // Hiding the scrollbar widens the page, so fill the gap to stop it shifting
    var root = document.documentElement;
    var scrollbar = window.innerWidth - root.clientWidth;
    root.classList.add('lightbox-open');
    if (scrollbar > 0) root.style.paddingRight = scrollbar + 'px';

    overlay = el;
    opener = source;
    el.showModal();
    close.focus();
    trackZoom(close);
    // Trigger fade-in on next frame, unless it has already been closed again
    requestAnimationFrame(function () {
      if (el.style.opacity !== '0') el.style.opacity = '1';
    });

    el.addEventListener('click', function (e) {
      // A tap on an image that can be panned is part of moving around it
      if (e.target === img && canPan(el)) return;
      closeLightbox();
    });
    // Focus sits on the close button, and it is position: fixed, so the browser's
    // own arrow-key scrolling skips the dialog and goes to the locked page
    el.addEventListener('keydown', function (e) {
      var step = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] }[e.key];
      if (!step) return;
      e.preventDefault();
      el.scrollBy(step[0], step[1]);
    });
    // Escape: run our close, so it fades. 'close' catches any the browser does itself
    el.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeLightbox();
    });
    el.addEventListener('close', function () {
      finishClose(el);
    });
  }

  function updateImage(img) {
    // An image inside a link keeps that link as its one job
    if (img.naturalWidth > img.clientWidth && !img.closest('a')) {
      img.classList.add('lightbox-zoom');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-haspopup', 'dialog');
      // Wraps the post's own alt text, which is left as it is
      img.setAttribute('aria-label', img.alt ? 'Enlarge image: ' + img.alt : 'Enlarge image');
    } else {
      img.classList.remove('lightbox-zoom');
      img.removeAttribute('tabindex');
      img.removeAttribute('role');
      img.removeAttribute('aria-haspopup');
      img.removeAttribute('aria-label');
    }
  }

  function updateImages() {
    var imgs = document.querySelectorAll('article.article img');
    for (var i = 0; i < imgs.length; i++) updateImage(imgs[i]);
  }

  function isZoomable(el) {
    return !!(el && el.classList && el.classList.contains('lightbox-zoom'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Each image is ready once loaded, so naturalWidth is available
    var imgs = document.querySelectorAll('article.article img');
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete) {
        updateImage(imgs[i]);
      } else {
        imgs[i].addEventListener('load', function (e) {
          updateImage(e.target);
        });
      }
    }
  });

  window.addEventListener('resize', updateImages);

  document.addEventListener('click', function (e) {
    if (isZoomable(e.target)) openLightbox(e.target);
  });

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && isZoomable(e.target)) {
      e.preventDefault();  // Space would otherwise scroll the page
      openLightbox(e.target);
    }
  });
})();
