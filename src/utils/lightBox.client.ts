function initLightbox() {
  const wrappers = document.querySelectorAll('.lightbox-wrapper');
  
  wrappers.forEach(wrapper => {
    const thumbnail = wrapper.querySelector('.lightbox-thumbnail');
    const overlay = wrapper.querySelector('.lightbox-overlay');
    
    // Skip if already initialized
    if ((wrapper as HTMLElement).dataset.initialized) return;
    
    // Create and append close button
    const closeButton = document.createElement('span');
    closeButton.className = 'lightbox-close';
    closeButton.innerHTML = 'CLOSE<span style="font-size: 4rem">×</span>';
    overlay?.appendChild(closeButton);
    
    thumbnail?.addEventListener('click', () => {
      overlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    // Close on overlay, figure, or close button click
    const closeElements = [overlay, wrapper.querySelector('.lightbox-figure')];
    closeElements.forEach(element => {
      element?.addEventListener('click', () => {
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Mark as initialized
    ((wrapper as HTMLElement).dataset.initialized)  = 'true';
  });
}

// Run on initial load
document.addEventListener('DOMContentLoaded', initLightbox);

// Run on view transitions
document.addEventListener('astro:page-load', initLightbox); 