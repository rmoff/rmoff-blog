document.addEventListener('DOMContentLoaded', () => {
    const codeBlocks = document.querySelectorAll('.rouge.highlight');

    codeBlocks.forEach((block) => {
      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.innerHTML = '<i class="fas fa-copy"></i>';
      copyButton.style.display = 'none';

      // Position the button
      block.style.position = 'relative';
      block.appendChild(copyButton);

      // Show button on hover
      block.addEventListener('mouseenter', () => {
        copyButton.style.display = 'block';
      });

      block.addEventListener('mouseleave', () => {
        copyButton.style.display = 'none';
      });

      // Copy functionality
      copyButton.addEventListener('click', () => {
        const codeElement = block.querySelector('code');

        // Get the raw text content by creating a temporary element
        const temp = document.createElement('div');
        temp.innerHTML = codeElement.innerHTML;

        // Replace all spans with their text content
        const spans = temp.querySelectorAll('span');
        spans.forEach(span => {
          span.outerHTML = span.textContent;
        });

        // Get the cleaned text
        const rawCode = temp.textContent;

        // Copy to clipboard
        navigator.clipboard.writeText(rawCode);

        // Visual feedback
        const originalBackground = copyButton.style.backgroundColor;
        const originalColor = copyButton.style.color;
        const originalHTML = copyButton.innerHTML;

        copyButton.innerHTML = '<i class="fas fa-check"></i>';
        copyButton.style.backgroundColor = 'green';
        copyButton.style.color = 'white';

        setTimeout(() => {
          copyButton.innerHTML = originalHTML;
          copyButton.style.backgroundColor = originalBackground;
          copyButton.style.color = originalColor;
        }, 2000);
      });
    });
  });
