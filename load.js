const parts = [
  ["mount-hero", "partials/hero.html"],
  ["mount-nav", "partials/nav.html"],
  ["mount-sobre", "partials/sobre.html"],
  ["mount-cardapio", "partials/menu.html"],
  ["mount-cta", "partials/cta.html"],
  ["mount-galeria", "partials/galeria.html"],
  ["mount-localizacao", "partials/localizacao.html"],
  ["mount-footer", "partials/footer.html"]
];

function setupImageFallbacks() {
  const imgs = document.querySelectorAll("img");
  imgs.forEach(img => {
    img.loading = "lazy";
    img.addEventListener("error", () => {
      if (img.dataset.fallbackTried === "1") return;
      img.dataset.fallbackTried = "1";
      const src = img.getAttribute("src") || "";
      const segs = src.split("/");
      const name = segs.pop() || "";
      const normalized = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "-");
      const altSrc = [...segs, normalized].join("/");
      console.warn("Imagem falhou:", src, "→ tentando:", altSrc);
      if (altSrc && altSrc !== src) img.src = altSrc;
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  function observeContent() {
    const targets = document.querySelectorAll('section h2, .sobre-intro, .gallery-subtitle, .local-subtitle, .menu-category-card, .gallery-item, .feature-item, .contact-item, .sobre-image, .sobre-text');
    targets.forEach((el, index) => {
      el.classList.add('reveal');
      // Add staggered delays for grids
      if (el.classList.contains('menu-category-card') || el.classList.contains('gallery-item') || el.classList.contains('feature-item')) {
        const delay = (index % 3) * 100; // 0ms, 100ms, 200ms
        el.style.transitionDelay = `${delay}ms`;
      }
      observer.observe(el);
    });
  }

  // Responsive Adaptation Function
  function adaptResponsiveLayout() {
    // 1. Calculate 1vh to fix mobile browser 100vh issue
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // 2. Add device class to body for specific CSS targeting
    const width = window.innerWidth;
    document.body.classList.remove('is-mobile', 'is-tablet', 'is-desktop');

    if (width <= 480) {
      document.body.classList.add('is-mobile');
    } else if (width <= 900) {
      document.body.classList.add('is-tablet');
    } else {
      document.body.classList.add('is-desktop');
    }

    // 3. Adjust specific elements if needed
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg) {
      // Ensure image fits within viewport minus padding
      lightboxImg.style.maxHeight = `calc(${vh * 100}px - 40px)`;
    }
  }

  // Initial call
  adaptResponsiveLayout();

  // Listen for resize and orientation change
  window.addEventListener('resize', adaptResponsiveLayout);
  window.addEventListener('orientationchange', () => {
    setTimeout(adaptResponsiveLayout, 100);
  });

  let loadedCount = 0;
  const totalParts = parts.length;

  parts.forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (!el) {
      loadedCount++;
      return;
    }
    fetch(path + "?v=" + new Date().getTime())
      .then(r => r.text())
      .then(t => {
        el.innerHTML = t;
        setupImageFallbacks();
        if (id === 'mount-cardapio') {
          setupMenuInteraction();
          setupMenuLightbox(); // Initialize menu images lightbox
        }
        if (id === 'mount-galeria') setupGalleryLightbox();
      })
      .catch(() => { })
      .finally(() => {
        loadedCount++;
        if (loadedCount === totalParts) {
          // All parts loaded, initialize animations
          setTimeout(observeContent, 100); // Small delay to ensure DOM is ready
          adaptResponsiveLayout(); // Apply layout adaptations after content load
        }
      });
  });
});

function setupMenuInteraction() {
  const cards = document.querySelectorAll('.menu-category-card');
  const modal = document.getElementById('menu-modal');
  const modalBody = document.getElementById('menu-modal-body');
  const closeBtn = document.querySelector('.menu-modal-close');

  if (!modal) return;

  // Open Modal
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const targetId = card.dataset.target;
      const contentSource = document.getElementById('content-' + targetId);
      if (contentSource) {
        modalBody.innerHTML = contentSource.innerHTML;
        modal.style.display = "block";

        // Enable lightbox for the image inside the modal
        const modalImg = modalBody.querySelector('img');
        if (modalImg) {
          modalImg.style.cursor = "zoom-in";
          modalImg.addEventListener('click', (e) => {
            e.stopPropagation();
            const lightbox = document.getElementById('gallery-lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            if (lightbox && lightboxImg) {
              lightboxImg.src = modalImg.src;
              lightbox.classList.add('open');
            }
          });
        }
      }
    });
  });

  // Close Modal
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener('click', (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  });
}

function setupMenuLightbox() {
  const menuImages = document.querySelectorAll('.menu-full-img');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');

  if (!lightbox || menuImages.length === 0) return;

  const items = [];
  menuImages.forEach((img, index) => {
    items.push({
      src: img.src,
      alt: img.alt,
      caption: '' // No caption for menu images
    });

    img.addEventListener('click', () => {
      // Temporarily override the navigation for menu
      setupLightboxNavigation(items, index);
      lightbox.classList.add('open');
    });
  });
}

// Generalized Lightbox Navigation Helper
function setupLightboxNavigation(items, initialIndex) {
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');

  let currentIndex = initialIndex;

  function showImage(index) {
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    currentIndex = index;

    lightboxImg.src = items[currentIndex].src;
    lightboxImg.alt = items[currentIndex].alt;
    lightboxCaption.innerText = items[currentIndex].caption || '';

    // Hide caption if empty
    lightboxCaption.style.display = items[currentIndex].caption ? 'block' : 'none';
  }

  showImage(currentIndex);

  // Remove old event listeners by cloning nodes (simple trick) or managing state.
  // Since we have multiple sources (Gallery vs Menu) using the same Lightbox buttons,
  // we need to be careful not to stack listeners.
  // A robust way is to replace the button elements to strip listeners.

  const newPrev = prevBtn.cloneNode(true);
  const newNext = nextBtn.cloneNode(true);
  prevBtn.parentNode.replaceChild(newPrev, prevBtn);
  nextBtn.parentNode.replaceChild(newNext, nextBtn);

  newPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    showImage(currentIndex - 1);
  });

  newNext.addEventListener('click', (e) => {
    e.stopPropagation();
    showImage(currentIndex + 1);
  });

  // Re-attach keyboard listener (needs to be global but context-aware, 
  // simpler here to just update a global variable or object, but for now we rely on click)
  // To handle keyboard correctly without stacking, we'd need a global 'currentContext' object.
  // For this scope, let's keep it simple: We won't re-attach global keyboard listeners 
  // because they call a hardcoded 'showImage' in setupGalleryLightbox.
  // FIX: We need to override the keyboard behavior too.

  // Let's attach a temporary handler to the lightbox element itself for keydown? 
  // No, keydown is on document.
  // We will assign the current 'showImage' function to a global property if we want proper keyboard support,
  // or just accept that arrow keys might trigger the Gallery logic if we don't clean it up.
  // Given the complexity, we'll implement a simple override on the document for this session.

  window.currentLightboxNavigator = (direction) => {
    if (direction === 'prev') showImage(currentIndex - 1);
    if (direction === 'next') showImage(currentIndex + 1);
  };
}

// Update Keyboard Listener to use the dynamic navigator
document.addEventListener('keydown', (e) => {
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox || !lightbox.classList.contains('open')) return;

  if (e.key === 'Escape') lightbox.classList.remove('open');
  if (window.currentLightboxNavigator) {
    if (e.key === 'ArrowLeft') window.currentLightboxNavigator('prev');
    if (e.key === 'ArrowRight') window.currentLightboxNavigator('next');
  }
});

function setupGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('gallery-lightbox');
  // ... elements ...
  const closeBtn = document.querySelector('.lightbox-close');
  // ... load more logic ...

  // Load More Functionality
  const galleries = document.querySelectorAll('.gallery');
  const loadMoreBtn = document.getElementById('load-more-gallery');
  const ITEMS_PER_PAGE = 8; // 2 rows of 4 images

  if (galleries.length > 0 && loadMoreBtn) {
    let hasHiddenItems = false;

    // Initial State
    galleries.forEach(gallery => {
      const items = gallery.querySelectorAll('.gallery-item');
      items.forEach((item, index) => {
        if (index >= ITEMS_PER_PAGE) {
          item.classList.add('hidden');
          hasHiddenItems = true;
        }
      });
    });

    if (!hasHiddenItems) {
      loadMoreBtn.style.display = 'none';
    } else {
      loadMoreBtn.style.display = 'block';
    }

    // Button Click Handler
    loadMoreBtn.addEventListener('click', () => {
      let stillHidden = false;
      galleries.forEach(gallery => {
        const hiddenItems = gallery.querySelectorAll('.gallery-item.hidden');
        Array.from(hiddenItems).slice(0, ITEMS_PER_PAGE).forEach(item => {
          item.classList.remove('hidden');
        });

        // Check if this gallery still has hidden items
        if (gallery.querySelectorAll('.gallery-item.hidden').length > 0) {
          stillHidden = true;
        }
      });

      // If no more hidden items in ANY gallery, hide the button
      if (!stillHidden) {
        loadMoreBtn.style.display = 'none';
      }
    });
  }

  if (!lightbox || galleryItems.length === 0) return;

  const items = [];
  galleryItems.forEach((item, index) => {
    const img = item.querySelector('img');
    // const caption = item.querySelector('figcaption'); // User requested to remove captions
    if (img) {
      items.push({
        src: img.src,
        alt: img.alt,
        caption: '' // Empty caption
      });

      item.addEventListener('click', () => {
        setupLightboxNavigation(items, index); // Use shared helper
        lightbox.classList.add('open');
      });
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      lightbox.classList.remove('open');
    });
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('open');
    }
  });
}
