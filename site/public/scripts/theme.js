(() => {
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;
  const sync = () => {
    const t = document.documentElement.getAttribute("data-theme");
    btn.textContent = t === "dark" ? "☀" : "🌙";
    btn.setAttribute("aria-label", t === "dark" ? "切换为浅色" : "切换为深色");
  };
  sync();
  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("aiport-theme", next); } catch (_) {}
    sync();
  });
})();
