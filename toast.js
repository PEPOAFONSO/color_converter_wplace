// ===== Global Toast System =====
function showToast(message, type = "info") {
  let toast = document.getElementById("globalToast") || document.getElementById("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "globalToast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = "block";

  // Animate
  setTimeout(() => {
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => (toast.style.display = "none"), 300);
    }, 1800);
  }, 10);
}

// ===== Mobile Burger =====
(function initMobileMenuOnce(){
  if (window.__mobileMenuInit) return; // guard
  window.__mobileMenuInit = true;

  document.addEventListener("DOMContentLoaded", () => {
    const burger   = document.querySelector(".nav-burger");
    const menu     = document.getElementById("mobileMenu");
    const backdrop = document.getElementById("menuBackdrop");
    if (!burger || !menu || !backdrop) return; // page without mobile menu

    if (burger.dataset.bound === "true") return;
    burger.dataset.bound = "true";

    let open = false;
    const setOpen = (v) => {
      open = v;
      burger.setAttribute("aria-expanded", String(v));
      menu.classList.toggle("show", v);
      menu.setAttribute("aria-hidden", String(!v));
      backdrop.hidden = !v;
      document.body.classList.toggle("menu-open", v);
    };

    burger.addEventListener("click", () => setOpen(!open));
    backdrop.addEventListener("click", () => setOpen(false));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a,button")) setOpen(false);
    });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    window.addEventListener("resize", () => { if (window.innerWidth >= 981) setOpen(false); });
  });
})();
