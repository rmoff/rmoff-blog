document.addEventListener('DOMContentLoaded', function() {
  var copySVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="0" ry="0"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var checkSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
  var crossSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  // Stands in for a callout while the text is tidied up. Private-use character,
  // so it can't be in the code itself.
  var CALLOUT = '';

  // One live region for the page: tells screen readers how a copy went.
  var status = document.createElement('div');
  status.className = 'copy-status';
  status.setAttribute('role', 'status');
  document.body.appendChild(status);

  // The code as a reader wants it pasted: no line numbers, no AsciiDoc callouts
  // (the circled numbers, plus the <b>(1)</b> that Asciidoctor puts after each)
  // or the spaces before them, and no final newline, which would run a command
  // on paste.
  function codeText(pre) {
    var code = (pre.querySelector('code') || pre).cloneNode(true);
    code.querySelectorAll('.linenos').forEach(function(gutter) { gutter.remove(); });
    code.querySelectorAll('.conum').forEach(function(conum) {
      var next = conum.nextElementSibling;
      if (next && next.tagName === 'B') next.remove();
      conum.replaceWith(CALLOUT);
    });
    return code.textContent
      .replace(new RegExp('[ \\t]*' + CALLOUT, 'g'), '')
      .replace(/\n+$/, '');
  }

  function writeToClipboard(text) {
    try {
      return navigator.clipboard.writeText(text);
    } catch (err) {
      // No clipboard API at all, e.g. a page not served over HTTPS.
      return Promise.reject(err);
    }
  }

  document.querySelectorAll('pre').forEach(function(pre) {
    // Line numbers are a <pre> of their own: nested in Rouge's, beside the code
    // in Chroma's. The button belongs to the code.
    if (pre.parentElement.closest('pre') || pre.querySelector('.lnt')) return;

    // Session transcripts (the ev-* blocks) stack tightly with no padding, so
    // there is nowhere to put a button without covering their text.
    if (pre.closest('[class^="ev-"], [class*=" ev-"]')) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-button';
    button.title = 'Copy code';
    button.setAttribute('aria-label', 'Copy code');
    button.innerHTML = copySVG;

    // The <pre> scrolls sideways, so the button goes beside it, in a wrapper,
    // to stay in the corner while the code moves.
    var wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(button);
    wrapper.appendChild(pre);

    var resetTimer;

    function showResult(className, icon, label, message) {
      clearTimeout(resetTimer);
      button.className = 'copy-button ' + className;
      button.innerHTML = icon + '<span>' + label + '</span>';
      status.textContent = message;

      resetTimer = setTimeout(function() {
        button.className = 'copy-button';
        button.innerHTML = copySVG;
        status.textContent = '';
      }, 2000);
    }

    button.addEventListener('click', function() {
      // Cleared first so a second copy of the same block is announced again.
      status.textContent = '';
      writeToClipboard(codeText(pre)).then(function() {
        showResult('is-copied', checkSVG, 'Copied', 'Copied');
      }, function() {
        showResult('is-failed', crossSVG, 'Copy failed', 'Copy failed. Select the code and copy it by hand.');
      });
    });
  });
});
