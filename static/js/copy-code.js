document.addEventListener('DOMContentLoaded', function() {
  var copySVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="0" ry="0"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var checkSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  document.querySelectorAll('.rouge.highlight').forEach(function(block) {
    var copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = copySVG;
    copyButton.style.display = 'none';

    block.style.position = 'relative';
    block.appendChild(copyButton);

    block.addEventListener('mouseenter', function() { copyButton.style.display = 'block'; });
    block.addEventListener('mouseleave', function() { copyButton.style.display = 'none'; });

    copyButton.addEventListener('click', function() {
      var codeElement = block.querySelector('code');
      var temp = document.createElement('div');
      temp.innerHTML = codeElement.innerHTML;
      temp.querySelectorAll('span').forEach(function(span) {
        span.outerHTML = span.textContent;
      });
      navigator.clipboard.writeText(temp.textContent);

      var originalHTML = copyButton.innerHTML;
      copyButton.innerHTML = checkSVG;
      copyButton.style.backgroundColor = '#1A6B5C';
      copyButton.style.color = 'white';

      setTimeout(function() {
        copyButton.innerHTML = originalHTML;
        copyButton.style.backgroundColor = '';
        copyButton.style.color = '';
      }, 2000);
    });
  });
});
