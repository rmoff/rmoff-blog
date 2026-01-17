(function() {
  'use strict';

  var STORAGE_KEY = 'blog-theme';
  var LIGHT_THEME = 'light';
  var DARK_THEME = 'dark';

  function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? LIGHT_THEME : DARK_THEME;
  }

  function getCurrentTheme() {
    var stored = getStoredTheme();
    if (stored) return stored;
    return getSystemTheme();
  }

  function setTheme(theme) {
    if (theme === LIGHT_THEME) {
      document.documentElement.setAttribute('data-theme', LIGHT_THEME);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleIcon(theme);
    updateGiscusTheme(theme);
    updateSyntaxHighlighting(theme);
  }

  function updateToggleIcon(theme) {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    var icon = toggle.querySelector('i');
    if (!icon) return;
    // Show sun icon when in dark mode (to switch to light)
    // Show moon icon when in light mode (to switch to dark)
    if (theme === LIGHT_THEME) {
      icon.className = 'fas fa-moon';
    } else {
      icon.className = 'fas fa-sun';
    }
  }

  function updateGiscusTheme(theme) {
    var giscusFrame = document.querySelector('iframe.giscus-frame');
    if (giscusFrame) {
      giscusFrame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: theme === LIGHT_THEME ? 'light' : 'dark_dimmed' } } },
        'https://giscus.app'
      );
    }
  }

  // Monokai dark colors -> GitHub light colors mapping
  var COLOR_MAP = {
    '#f8f8f2': '#24292f', // light gray -> dark text
    '#f92672': '#cf222e', // pink -> red
    '#66d9ef': '#0550ae', // cyan -> blue
    '#e6db74': '#0a3069', // yellow -> dark blue (strings)
    '#ae81ff': '#0550ae', // purple -> blue (numbers)
    '#a6e22e': '#116329', // green -> dark green
    '#75715e': '#6e7781', // gray -> gray (comments)
    '#fd971f': '#953800'  // orange -> brown
  };

  function updateSyntaxHighlighting(theme) {
    var spans = document.querySelectorAll('pre span[style], code span[style], .highlight span[style], .listingblock span[style]');
    spans.forEach(function(span) {
      var style = span.getAttribute('style') || '';
      if (theme === LIGHT_THEME) {
        // Store original style if not already stored
        if (!span.dataset.originalStyle) {
          span.dataset.originalStyle = style;
        }
        // Remove background colors and remap text colors
        var newStyle = style.replace(/background-color:\s*#[0-9a-fA-F]+;?/gi, 'background-color: transparent;');
        Object.keys(COLOR_MAP).forEach(function(dark) {
          var light = COLOR_MAP[dark];
          newStyle = newStyle.replace(new RegExp('color:\\s*' + dark.replace('#', '#?'), 'gi'), 'color: ' + light);
        });
        span.setAttribute('style', newStyle);
      } else {
        // Restore original style
        if (span.dataset.originalStyle) {
          span.setAttribute('style', span.dataset.originalStyle);
        }
      }
    });
  }

  function toggleTheme() {
    var current = getCurrentTheme();
    var newTheme = current === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
    setTheme(newTheme);
  }

  function init() {
    var theme = getCurrentTheme();
    updateToggleIcon(theme);
    updateSyntaxHighlighting(theme);

    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', toggleTheme);
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(e) {
      if (!getStoredTheme()) {
        setTheme(e.matches ? LIGHT_THEME : DARK_THEME);
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
