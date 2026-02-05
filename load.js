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
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  function observeContent() {
    const targets = document.querySelectorAll('section h2, .sobre-intro, .gallery-subtitle, .local-subtitle, .gallery-item, .feature-item, .contact-item, .sobre-image, .sobre-text, .menu-category-card');
    targets.forEach((el, index) => {
      el.classList.add('reveal');
      if (el.classList.contains('gallery-item') || el.classList.contains('feature-item') || el.classList.contains('menu-category-card')) {
        const delay = (index % 3) * 100;
        el.style.transitionDelay = `${delay}ms`;
      }
      observer.observe(el);
    });
  }

  function adaptResponsiveLayout() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    const width = window.innerWidth;
    document.body.classList.remove('is-mobile', 'is-tablet', 'is-desktop');

    if (width <= 480) {
      document.body.classList.add('is-mobile');
    } else if (width <= 900) {
      document.body.classList.add('is-tablet');
    } else {
      document.body.classList.add('is-desktop');
    }

    const lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg) {
      lightboxImg.style.maxHeight = `calc(${vh * 100}px - 40px)`;
    }
  }

  adaptResponsiveLayout();

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
          setupMobileMenu(el);
        }
        if (id === 'mount-cardapio') {
          setupMenuInteraction();
          setupMenuLightbox();
        }
        if (id === 'mount-galeria') setupGalleryLightbox();
      })
      .catch(() => { })
      .finally(() => {
        loadedCount++;
        if (loadedCount === totalParts) {
          setTimeout(observeContent, 100);
          adaptResponsiveLayout();
        }
      });
  });
});

function setupMobileMenu(container) {
  const root = container || document;
  const toggle = root.querySelector('.nav-toggle');
  const links = root.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });

    document.addEventListener('click', (e) => {
      if (links.classList.contains('open') && !links.contains(e.target) && !toggle.contains(e.target)) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

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

  const menuImages = document.querySelectorAll('.menu-full-img');
  const items = [];

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
      if (items.length > index) {
        setupLightboxNavigation(items, index);
        lightbox.classList.add('active');
        lightbox.classList.add('menu-mode');
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
      caption: ''
    });

    img.addEventListener('click', () => {
      setupLightboxNavigation(items, index);
      lightbox.classList.add('active');
      lightbox.classList.add('menu-mode');
    });
  });
}

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

    lightboxCaption.style.display = items[currentIndex].caption ? 'block' : 'none';
  }

  showImage(currentIndex);

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

  window.currentLightboxNavigator = (direction) => {
    if (direction === 'prev') showImage(currentIndex - 1);
    if (direction === 'next') showImage(currentIndex + 1);
  };
}

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
  const closeBtn = document.querySelector('.lightbox-close');

  const galleries = document.querySelectorAll('.gallery');
  const loadMoreBtn = document.getElementById('load-more-gallery');
  const ITEMS_PER_PAGE = 6;

  if (galleries.length > 0 && loadMoreBtn) {
    let hasHiddenItems = false;

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

    loadMoreBtn.addEventListener('click', () => {
      galleries.forEach(gallery => {
        const hiddenItems = gallery.querySelectorAll('.gallery-item.hidden');
        hiddenItems.forEach(item => {
          item.classList.remove('hidden');
        });
      });

      loadMoreBtn.style.display = 'none';
    });
  }

  if (!lightbox || galleryItems.length === 0) return;

  const items = [];
  galleryItems.forEach((item, index) => {
    const img = item.querySelector('img');
    if (img) {
      items.push({
        src: img.src,
        alt: img.alt,
        caption: ''
      });

      item.addEventListener('click', () => {
        setupLightboxNavigation(items, index);
        lightbox.classList.add('active');
        lightbox.classList.remove('menu-mode');
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
