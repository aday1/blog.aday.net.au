(() => {
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;

  const isEnabled = () => {
    const body = document.body;
    return !prefersReduced && !body.classList.contains("film-off") && !body.classList.contains("animations-off");
  };

  const wrapImage = (img) => {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.closest(".film-frame-stack")) return;
    if (img.classList.contains("service-icon") || img.classList.contains("headliner-badge")) return;
    if (img.width && img.width < 48 && img.height < 48) return;

    const figure = document.createElement("figure");
    figure.className = "film-frame";

    const stack = document.createElement("div");
    stack.className = "film-frame-stack";

    const phosphor = document.createElement("span");
    phosphor.className = "film-phosphor";
    phosphor.setAttribute("aria-hidden", "true");

    const grain = document.createElement("span");
    grain.className = "film-grain";
    grain.setAttribute("aria-hidden", "true");

    const scratchOuter = document.createElement("span");
    scratchOuter.className = "film-scratch film-scratch-outer";
    scratchOuter.setAttribute("aria-hidden", "true");

    const scratchInner = document.createElement("span");
    scratchInner.className = "film-scratch film-scratch-inner";
    scratchInner.setAttribute("aria-hidden", "true");

    const parent = img.parentElement;
    if (!parent) return;

    img.classList.add("film-photo");
    const next = img.nextSibling;
    stack.appendChild(img);
    stack.append(phosphor, grain, scratchOuter, scratchInner);
    figure.appendChild(stack);

    if (img.alt && !parent.closest("figcaption")) {
      const cap = document.createElement("figcaption");
      cap.textContent = img.alt;
      figure.appendChild(cap);
    }

    parent.insertBefore(figure, next);
  };

  const enhanceHeadlinerBackgrounds = () => {
    document.querySelectorAll(".headliner-card").forEach((card) => {
      const bg = card.querySelector(".headliner-bg");
      if (!bg || bg.closest(".film-frame-stack")) return;
      const stack = document.createElement("div");
      stack.className = "film-frame-stack headliner-film-stack";
      stack.style.cssText = "position:absolute;inset:0;z-index:0;pointer-events:none;";
      ["film-phosphor", "film-grain", "film-scratch film-scratch-outer", "film-scratch film-scratch-inner"].forEach((cls) => {
        const span = document.createElement("span");
        span.className = cls;
        span.setAttribute("aria-hidden", "true");
        stack.appendChild(span);
      });
      bg.classList.add("film-photo");
      card.insertBefore(stack, card.firstChild);
      stack.appendChild(bg);
    });
  };

  const run = () => {
    if (!isEnabled()) return;
    document.querySelectorAll("main img, .headliner-grid img.headliner-bg").forEach((img) => {
      if (img.classList.contains("headliner-bg")) return;
      wrapImage(img);
    });
    enhanceHeadlinerBackgrounds();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }

  if (!prefersReduced && !coarse) {
    document.body.classList.add("film-on");
  }
})();
