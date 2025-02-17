function initLightbox() {
  requestAnimationFrame(() => {
    const wrappers = document.querySelectorAll('.lightbox-wrapper');
    
    wrappers.forEach(wrapper => {
      const thumbnail = wrapper.querySelector('.lightbox-thumbnail');
      const overlay = wrapper.querySelector('.lightbox-overlay');
      
      // Skip if already initialized
      if ((wrapper as HTMLElement).dataset.initialized) return;
      
      // Create and append close button
      const closeButton = document.createElement('span');
      closeButton.className = 'lightbox-close';
      closeButton.innerHTML = '<div class="flex flex-row items-center gap-2"><div class="text-[1.5rem] text-white animate-pulse">CLICK/TAP ANYWHERE TO CLOSE</div><div class="text-[3rem] pb-1 text-red-500 animate-pulse">×</div></div>';
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
      ((wrapper as HTMLElement).dataset.initialized) = 'true';
    });
  });
}

// Run immediately and on view transitions
initLightbox();
document.addEventListener('astro:page-load', initLightbox); 