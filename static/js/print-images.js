// Post images are lazy (layouts/partials/post-images.html), and a browser prints straight
// after the beforeprint event without waiting for anything that event starts. Images the
// reader hadn't scrolled to would come out as blank boxes. So Ctrl/Cmd+P loads them first
// and then prints. Printing from a menu can't be held back like that: beforeprint still
// starts the downloads, but only images that arrive in time appear.
(function () {
  var MAX_WAIT_MS = 8000;
  var waiting = false;

  // Starts any images that haven't downloaded, and returns the ones still on their way
  function loadRemaining() {
    var imgs = document.querySelectorAll('article.article img:not([data-pagefind-meta])');
    var pending = [];
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].loading === 'lazy') imgs[i].loading = 'eager';
      if (!imgs[i].complete) pending.push(imgs[i]);
    }
    return pending;
  }

  window.addEventListener('beforeprint', loadRemaining);

  document.addEventListener('keydown', function (e) {
    if (e.key.toLowerCase() !== 'p' || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
    if (waiting) {
      e.preventDefault();
      return;
    }
    var pending = loadRemaining();
    if (pending.length === 0) return;

    e.preventDefault();
    waiting = true;
    var left = pending.length;
    function print() {
      if (!waiting) return;
      waiting = false;
      window.print();
    }
    function done() {
      left--;
      if (left === 0) print();
    }
    for (var i = 0; i < pending.length; i++) {
      pending[i].addEventListener('load', done);
      pending[i].addEventListener('error', done);
    }
    setTimeout(print, MAX_WAIT_MS);
  });
})();
