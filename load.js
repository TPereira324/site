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
        if (id === 'mount-cardapio') setupMenuInteraction();
        if (id === 'mount-galeria') setupGalleryLightbox();
      })
      .catch(() => { })
      .finally(() => {
        loadedCount++;
        if (loadedCount === totalParts) {
          // All parts loaded, initialize animations
          setTimeout(observeContent, 100); // Small delay to ensure DOM is ready
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

function setupGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');

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

  let currentIndex = 0;
  const items = [];

  galleryItems.forEach((item, index) => {
    const img = item.querySelector('img');
    const caption = item.querySelector('figcaption');
    if (img) {
      items.push({
        src: img.src,
        alt: img.alt,
        caption: caption ? caption.innerText : ''
      });

      item.addEventListener('click', () => {
        currentIndex = index;
        showImage(currentIndex);
        lightbox.classList.add('open');
      });
    }
  });

  function showImage(index) {
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    currentIndex = index;

    lightboxImg.src = items[currentIndex].src;
    lightboxImg.alt = items[currentIndex].alt;
    lightboxCaption.innerText = items[currentIndex].caption;
  }

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

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showImage(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showImage(currentIndex + 1);
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') lightbox.classList.remove('open');
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });
}
