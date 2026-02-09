// Render KaTeX math typesetting, but only if the <body> has the class feature-math
document.addEventListener('DOMContentLoaded', function() {
  if (document.body.classList.contains('feature-math') && !document.body.classList.contains('feature-nomath')) {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body);
    }
  }
});

// Render abcjs sheet music, but only if the <body> has the class feature-music
document.addEventListener('DOMContentLoaded', function() {
  if (document.body.classList.contains('feature-music') && !document.body.classList.contains('feature-nomusic')) {
    document.querySelectorAll('code.language-abc, code.abc').forEach(function(el, i) {
      var abc = el.textContent;
      if (el.classList.contains('remark-code')) {
        abc = '';
        el.querySelectorAll('.remark-code-line').forEach(function(line) {
          abc += '\n' + line.textContent;
        });
        abc = abc.trim();
      }
      var p = document.createElement('p');
      p.id = 'music-' + (i + 1);
      el.parentElement.parentNode.insertBefore(p, el.parentElement);
      el.parentElement.style.display = 'none';
      if (typeof ABCJS !== 'undefined') {
        ABCJS.renderAbc('music-' + (i + 1), abc, {
          paddingtop: 0, paddingbottom: 0, paddingright: 0, paddingleft: 0,
          responsive: 'resize'
        });
      }
    });
  }
});

// Highlight code listings, if <body> has the class feature-highlight
document.addEventListener('DOMContentLoaded', function() {
  if (document.body.classList.contains('feature-highlight') && !document.body.classList.contains('feature-nohighlight')) {
    if (typeof hljs !== 'undefined') {
      hljs.initHighlightingOnLoad();
    }
  }
});

// Turn images into figures with captions (feature-figcaption)
document.addEventListener('DOMContentLoaded', function() {
  if (!document.body.classList.contains('feature-figcaption') || document.body.classList.contains('feature-nofigcaption')) return;

  document.querySelectorAll('article img').forEach(function(img, i) {
    if (img.src.match(/#/)) return;
    var txt = false;
    var nextEl = img.nextElementSibling;
    if (nextEl && nextEl.tagName === 'EM') {
      txt = nextEl.innerHTML;
      nextEl.remove();
    } else {
      txt = img.getAttribute('title') || img.getAttribute('alt') || false;
    }
    if (txt) {
      var figure = document.createElement('figure');
      figure.id = 'fig-' + (i + 1);
      img.parentNode.insertBefore(figure, img);
      figure.appendChild(img);
      var caption = document.createElement('figcaption');
      caption.className = 'figcaption';
      caption.innerHTML = txt;
      figure.appendChild(caption);
    }
  });

  if (document.body.classList.contains('feature-figlink')) {
    document.querySelectorAll('article p, article li').forEach(function(el) {
      var oldHTML = el.innerHTML;
      var newHTML = oldHTML.replace(/Figure\s+(\d+)/g, '<a href="#fig-$1">Figure $1</a>');
      if (oldHTML !== newHTML) el.innerHTML = newHTML;
    });
  }
});

// Add captions to tables (feature-tablecaption)
document.addEventListener('DOMContentLoaded', function() {
  if (!document.body.classList.contains('feature-tablecaption')) return;

  document.querySelectorAll('article table').forEach(function(table, i) {
    var nextEl = table.nextElementSibling;
    if (nextEl && nextEl.tagName === 'P') {
      var em = nextEl.querySelector('em:only-child');
      if (em) {
        var txt = em.innerHTML;
        nextEl.remove();
        var caption = document.createElement('caption');
        caption.id = 'tbl-' + (i + 1);
        caption.innerHTML = txt;
        table.insertBefore(caption, table.firstChild);
      }
    }
  });

  if (document.body.classList.contains('feature-figlink')) {
    document.querySelectorAll('article p, article li').forEach(function(el) {
      var oldHTML = el.innerHTML;
      var newHTML = oldHTML.replace(/Table\s+(\d+)/g, '<a href="#tbl-$1">Table $1</a>');
      if (oldHTML !== newHTML) el.innerHTML = newHTML;
    });
  }
});
