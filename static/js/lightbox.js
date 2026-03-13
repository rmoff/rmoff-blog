// Lightbox for article images displayed smaller than their natural size
(function () {
  var overlay = null;

  function closeLightbox() {
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(function () {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        overlay = null;
      }, 200);
    }
  }

  function openLightbox(src) {
    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    var img = document.createElement('img');
    img.src = src;
    img.className = 'lightbox-img';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    // Trigger fade-in on next frame
    requestAnimationFrame(function () {
      overlay.style.opacity = '1';
    });
    overlay.addEventListener('click', closeLightbox);
  }

  function updateImages() {
    var imgs = document.querySelectorAll('article.article img');
    for (var i = 0; i < imgs.length; i++) {
      (function (img) {
        if (img.naturalWidth > img.clientWidth) {
          img.classList.add('lightbox-zoom');
          if (!img.dataset.lightbox) {
            img.dataset.lightbox = '1';
            img.addEventListener('click', function () {
              openLightbox(img.src);
            });
          }
        } else {
          img.classList.remove('lightbox-zoom');
        }
      })(imgs[i]);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Wait for images to load so naturalWidth is available
    var imgs = document.querySelectorAll('article.article img');
    var loaded = 0;
    var total = imgs.length;
    if (total === 0) return;

    function check() {
      loaded++;
      if (loaded >= total) updateImages();
    }

    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete) {
        check();
      } else {
        imgs[i].addEventListener('load', check);
        imgs[i].addEventListener('error', check);
      }
    }
  });

  window.addEventListener('resize', updateImages);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
})();
