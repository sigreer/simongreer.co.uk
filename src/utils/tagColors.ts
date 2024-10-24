// Wrap everything in an IIFE to avoid global scope pollution
(function() {
  const tagColors: Record<string, string> = {};
  const classNames: string[] = [
    'cyan1',
    'cyan2',
    'cyan3',
    'purple1',
    'purple2',
    'purple3',
    'red1',
    'red2',
    'red3',
    'orange1',
    'orange2',
    'orange3',
    'lime1',
    'lime2',
    'lime3',
    'green1',
    'green2',
    'green3',
    'blue1',
    'blue2',
    'blue3',
    'black1',
    'black2',
    'black3',
  ];
  let classIndex: number = 0;

  function getClassNameForTag(tag: string): string {
    if (!tagColors[tag]) {
      // Assign a class name from the list
      tagColors[tag] = classNames[classIndex];
      classIndex = (classIndex + 1) % classNames.length;
    }
    return tagColors[tag];
  }

  function applyTagColors(): void {
    const tags: NodeListOf<HTMLElement> = document.querySelectorAll('[data-tag]');
    tags.forEach(tagElement => {
      const tag: string | null = tagElement.getAttribute('data-tag');
      if (tag) {
        const className: string = getClassNameForTag(tag);
        tagElement.classList.add(className);
      }
    });
  }

  // Apply colors on initial load
  document.addEventListener('DOMContentLoaded', applyTagColors);

  // Expose a method to apply colors to dynamically added tags
  (window as any).applyTagColorsToNewElements = applyTagColors;

  // Optional: Save color assignments to localStorage
  window.addEventListener('beforeunload', () => {
    localStorage.setItem('tagColors', JSON.stringify(tagColors));
  });

  // Optional: Load color assignments from localStorage
  const savedTagColors: string | null = localStorage.getItem('tagColors');
  if (savedTagColors) {
    Object.assign(tagColors, JSON.parse(savedTagColors));
  }

  // Example: Listen to route changes (pseudo-code, replace with actual router event)
  document.addEventListener('astro:page-load', applyTagColors);
})();
