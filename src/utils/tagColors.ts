// Wrap everything in an IIFE to avoid global scope pollution
(() => {
  // Define colors exactly as they appear in CSS
  const colorClasses = [
    'gray1', 'gray3', 'slate1',  // Limited gray variants
    'red1', 'red3',
    'orange1', 'orange3',
    'amber1', 'amber3',
    'yellow1', 'yellow3',
    'lime1', 'lime3',
    'green1', 'green3',
    'emerald1', 'emerald3',
    'teal1', 'teal3',
    'cyan1', 'cyan3',
    'sky1', 'sky3',
    'blue1', 'blue3',
    'indigo1', 'indigo3',
    'violet1', 'violet3',
    'purple1', 'purple3',
    'fuchsia1', 'fuchsia3',
    'pink1', 'pink3',
    'rose1', 'rose3'
  ];

  // Hash function to get consistent number from string
  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  function getColorForTag(tag: string): string {
    const index = hashString(tag) % colorClasses.length;
    return colorClasses[index];
  }

  function applyTagColors(): void {
    document.querySelectorAll('[data-tag]').forEach((element: Element) => {
      if (element instanceof HTMLElement) {
        const tag = element.getAttribute('data-tag');
        if (tag) {
          // Remove any existing color classes
          element.classList.remove(...colorClasses);
          
          // Apply the correct color
          const colorClass = getColorForTag(tag);
          element.classList.add(colorClass);
        }
      }
    });
  }

  // Apply colors whenever the DOM changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        applyTagColors();
      }
    });
  });

  // Start observing the document
  observer.observe(document.body, { childList: true, subtree: true });

  // Apply colors on initial load and after navigation
  document.addEventListener('DOMContentLoaded', applyTagColors);
  document.addEventListener('astro:page-load', applyTagColors);

  // Make the function available globally
  window.applyTagColorsToNewElements = applyTagColors;
})();
