// Wrap everything in an IIFE to avoid global scope pollution
(() => {
  type ColorClass = {
    bg: string;
    text: string;
  };

  const colorClasses: Record<string, ColorClass> = {
    'gray': { bg: 'bg-gray-600', text: 'text-white' },
    'red': { bg: 'bg-red-600', text: 'text-white' },
    'blue': { bg: 'bg-blue-600', text: 'text-white' },
    'green': { bg: 'bg-green-600', text: 'text-white' },
    'purple': { bg: 'bg-purple-600', text: 'text-white' },
    'yellow': { bg: 'bg-yellow-600', text: 'text-white' },
    'indigo': { bg: 'bg-indigo-600', text: 'text-white' },
    'pink': { bg: 'bg-pink-600', text: 'text-white' },
    'teal': { bg: 'bg-teal-600', text: 'text-white' },
    'orange': { bg: 'bg-orange-600', text: 'text-white' },
  };

  const colorKeys = Object.keys(colorClasses);

  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  function getColorForTag(tag: string): ColorClass {
    const index = hashString(tag) % colorKeys.length;
    return colorClasses[colorKeys[index]];
  }

  function applyTagColors(): void {
    document.querySelectorAll('[data-tag]').forEach((element: Element) => {
      if (element instanceof HTMLElement) {
        const tag = element.getAttribute('data-tag');
        if (tag) {
          // Remove any existing color classes
          element.className = element.className.split(' ').filter(cls => 
            !cls.startsWith('bg-') && !cls.startsWith('text-')
          ).join(' ');
          
          // Apply new color classes
          const { bg, text } = getColorForTag(tag);
          element.classList.add(bg, text, 'rounded-md', 'px-2', 'py-1', 'text-xs', 'font-semibold', 'shadow-sm', 'transition');
        }
      }
    });
  }

  // Apply colors on DOM changes
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
