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
  parts.forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (!el) return;
    fetch(path + "?v=" + new Date().getTime())
      .then(r => r.text())
      .then(t => {
        el.innerHTML = t;
        setupImageFallbacks();
        if (id === 'mount-cardapio') setupMenuInteraction();
      })
      .catch(() => { });
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
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      }
    });
  });

  // Close Modal Function
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Close Button Click
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Click Outside Modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Escape Key
  document.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Gallery Load More logic
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'load-more-gallery') {
    const galleries = document.querySelectorAll('.gallery');
    if (galleries.length > 0) {
      galleries.forEach(gallery => gallery.classList.add('expanded'));
      e.target.style.display = 'none';
    }
  }
});

// Event delegation for Nav Toggle to ensure it works regardless of load order
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('.nav-toggle');
  if (toggle) {
    const nav = toggle.closest('nav') || document.querySelector('#mount-nav');
    const links = nav.querySelector('.nav-links');
    if (links) {
      links.classList.toggle('open');
      const expanded = links.classList.contains('open') ? "true" : "false";
      toggle.setAttribute("aria-expanded", expanded);
    }
  }

  // Close menu when clicking a link
  if (e.target.closest('.nav-links a')) {
    const links = e.target.closest('.nav-links');
    const toggle = document.querySelector('.nav-toggle');
    if (links) links.classList.remove('open');
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }
});


const lightbox = document.createElement('div');
lightbox.id = 'lightbox';
lightbox.className = 'lightbox';
lightbox.innerHTML = `
  <span class="lightbox-close">&times;</span>
  <img class="lightbox-content" id="lightbox-img">
`;
document.body.appendChild(lightbox);

const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.lightbox-close');

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

document.addEventListener('keydown', (e) => {
  if (e.key === "Escape" && lightbox.classList.contains('active')) {
    lightbox.classList.remove('active');
  }
});

document.addEventListener('click', (e) => {
  const img = e.target.closest('.gallery-item img');
  if (img) {
    lightbox.classList.add('active');
    lightboxImg.src = img.src;
  }
});

const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

setTimeout(() => {
  const fadeElements = document.querySelectorAll('.fade-in-section');
  fadeElements.forEach(el => observer.observe(el));
}, 100);

