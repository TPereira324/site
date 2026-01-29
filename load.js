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
    const targets = document.querySelectorAll('section h2, .sobre-intro, .gallery-subtitle, .local-subtitle, .gallery-item, .feature-item, .contact-item, .sobre-image, .sobre-text');
    targets.forEach((el, index) => {
      el.classList.add('reveal');
      // Add staggered delays for grids
      if (el.classList.contains('gallery-item') || el.classList.contains('feature-item')) {
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
        if (id === 'mount-nav') {
            setupMobileMenu(el); // Initialize mobile menu scoped to container
        }
        if (id === 'mount-cardapio') {
          // Initialize BOTH interactions: card click AND direct image click (if any)
          setupMenuInteraction();
          setupMenuLightbox(); 
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

function setupMobileMenu(container) {
    // Default to document if no container provided
    const root = container || document;
    const toggle = root.querySelector('.nav-toggle');
    const links = root.querySelector('.nav-links');
    
    if (toggle && links) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', links.classList.contains('open'));
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (links.classList.contains('open') && !links.contains(e.target) && !toggle.contains(e.target)) {
                links.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close menu when clicking a link
        links.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                links.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

function setupMenuInteraction() {
  const cards = document.querySelectorAll('.menu-category-card');
  const lightbox = document.getElementById('gallery-lightbox');

  // We need to build the items array from the hidden images
  const menuImages = document.querySelectorAll('.menu-full-img');
  const items = [];
  
  // If no menu-full-img found, fallback to using the images inside the cards
  if (menuImages.length === 0) {
     const cardImages = document.querySelectorAll('.menu-category-card img');
     cardImages.forEach(img => {
        items.push({
           src: img.src,
           alt: img.alt,
           caption: ''
        });
     });
  } else {
      menuImages.forEach(img => {
        items.push({
          src: img.src,
          alt: img.alt,
          caption: ''
        });
      });
  }

  if (!lightbox || cards.length === 0) return;

  cards.forEach((card, index) => {
    card.addEventListener('click', () => {
      // Simplified logic: Just open the lightbox at the card's index
      // This assumes the order of cards matches the order of items
      if (items.length > index) {
          setupLightboxNavigation(items, index);
          lightbox.classList.add('active');
          lightbox.classList.add('menu-mode'); // Enable menu mode for larger images
      }
    });
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
      lightbox.classList.add('active');
      lightbox.classList.add('menu-mode');
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
  if (!lightbox || !lightbox.classList.contains('active')) return;

  if (e.key === 'Escape') lightbox.classList.remove('active');
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
  const ITEMS_PER_PAGE = 6; // Reduced to 6 to hide more initial images

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
      loadMoreBtn.style.display = '';
    }

    // Button Click Handler
    loadMoreBtn.addEventListener('click', () => {
      galleries.forEach(gallery => {
        const hiddenItems = gallery.querySelectorAll('.gallery-item.hidden');
        // Show ALL hidden items at once
        hiddenItems.forEach(item => {
          item.classList.remove('hidden');
        });
      });
      
      // Hide button after showing all
      loadMoreBtn.style.display = 'none';
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
        lightbox.classList.add('active');
        lightbox.classList.remove('menu-mode'); // Ensure menu mode is off for gallery
      });
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      lightbox.classList.remove('active');
    });
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
    }
  });
}
