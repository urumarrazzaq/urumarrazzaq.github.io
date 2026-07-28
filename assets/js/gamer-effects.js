/* Gamer Theme — lightweight interactive effects */
(function () {
  "use strict";

  /* ---------- Achievement Toast ---------- */
  function showToast(title, body) {
    let toast = document.querySelector(".gamer-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "gamer-toast";
      toast.innerHTML = '<div class="toast-title"></div><div class="toast-body"></div>';
      document.body.appendChild(toast);
    }
    toast.querySelector(".toast-title").textContent = title;
    toast.querySelector(".toast-body").textContent = body;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 3200);
  }

  const achievements = {
    about: "Player Profile Unlocked",
    skills: "Skill Tree Revealed",
    portfolio: "Quest Log Opened",
    services: "Services Menu Accessed",
    contact: "Comms Channel Ready"
  };
  const seen = new Set();

  const sections = document.querySelectorAll("main section[id]");
  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && achievements[entry.target.id] && !seen.has(entry.target.id)) {
            seen.add(entry.target.id);
            showToast("ACHIEVEMENT UNLOCKED", achievements[entry.target.id]);
          }
        });
      },
      { threshold: 0.35 }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* ---------- Cursor Glow ---------- */
  function initCursorGlow() {
    if (window.matchMedia("(pointer: coarse)").matches) return; // skip on touch
    const glow = document.createElement("div");
    glow.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      "width:22px",
      "height:22px",
      "border-radius:50%",
      "pointer-events:none",
      "z-index:9999",
      "background:radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)",
      "box-shadow:0 0 18px rgba(139,92,246,0.55)",
      "transform:translate(-50%,-50%)",
      "transition:opacity 0.2s ease, transform 0.08s linear",
      "opacity:0"
    ].join(";");
    document.body.appendChild(glow);

    let raf = null;
    window.addEventListener("mousemove", (e) => {
      glow.style.opacity = "1";
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      });
    });
    window.addEventListener("mouseleave", () => (glow.style.opacity = "0"));
  }
  initCursorGlow();

  /* ---------- [data-reveal] scroll reveal (robust, no cached offsets) ---------- */
  function initRevealObserver() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    items.forEach((el) => {
      const delay = parseInt(el.getAttribute("data-reveal-delay"), 10) || 0;
      el.style.transitionDelay = delay + "ms";
    });

    if (!("IntersectionObserver" in window)) {
      // No IO support: just show everything, don't risk hiding content.
      items.forEach((el) => el.classList.add("reveal-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((el) => observer.observe(el));

    // Safety net: if anything is somehow still hidden a few seconds after
    // load (e.g. an unusual layout edge case), reveal it rather than let
    // it stay invisible forever.
    setTimeout(() => {
      items.forEach((el) => el.classList.add("reveal-in"));
    }, 4000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRevealObserver);
  } else {
    initRevealObserver();
  }

  /* ---------- HUD corner brackets on hero ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const hero = document.getElementById("hero");
    if (hero) {
      const corners = document.createElement("div");
      corners.setAttribute("aria-hidden", "true");
      corners.style.cssText = "position:absolute;inset:20px;pointer-events:none;z-index:1;";
      corners.innerHTML = `
        <span style="position:absolute;top:0;left:0;width:26px;height:26px;border-top:2px solid #8b5cf6;border-left:2px solid #8b5cf6;"></span>
        <span style="position:absolute;top:0;right:0;width:26px;height:26px;border-top:2px solid #8b5cf6;border-right:2px solid #8b5cf6;"></span>
        <span style="position:absolute;bottom:0;left:0;width:26px;height:26px;border-bottom:2px solid #22e5ff;border-left:2px solid #22e5ff;"></span>
        <span style="position:absolute;bottom:0;right:0;width:26px;height:26px;border-bottom:2px solid #22e5ff;border-right:2px solid #22e5ff;"></span>
      `;
      hero.style.position = "relative";
      hero.appendChild(corners);
    }
  });
})();
