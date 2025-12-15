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
  const imgs = document.querySelectorAll("#galeria img");
  imgs.forEach(img => {
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
      if (altSrc && altSrc !== src) img.src = altSrc;
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  parts.forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (!el) return;
    fetch(path)
      .then(r => r.text())
      .then(t => {
        el.innerHTML = t;
        setupImageFallbacks();
      })
      .catch(() => {});
  });
});
