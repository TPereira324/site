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
      })
      .catch(() => { });
  });
});

// Gallery Load More logic
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'load-more-gallery') {
    const gallery = document.querySelector('.gallery');
    if (gallery) {
      gallery.classList.add('expanded');
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
