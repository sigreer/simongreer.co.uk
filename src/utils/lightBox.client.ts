function initLightbox() {
  const wrappers = document.querySelectorAll('.lightbox-wrapper');
  
  wrappers.forEach(wrapper => {
    const thumbnail = wrapper.querySelector('.lightbox-thumbnail');
    const overlay = wrapper.querySelector('.lightbox-overlay');
    
    thumbnail?.addEventListener('click', () => {
      overlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    overlay?.addEventListener('click', () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

document.addEventListener('DOMContentLoaded', initLightbox); 