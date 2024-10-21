const tagColors: Record<string, string> = {};

function getColorForTag(tag: string): string {
  if (!tagColors[tag]) {
    // Generate a random color
    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    tagColors[tag] = color;
  }
  return tagColors[tag];
}

function applyTagColors(): void {
  const tags = document.querySelectorAll<HTMLElement>('[data-tag]');
  tags.forEach(tagElement => {
    const tag = tagElement.getAttribute('data-tag');
    if (tag) {
      tagElement.style.color = getColorForTag(tag);
    }
  });
}

document.addEventListener('DOMContentLoaded', applyTagColors);