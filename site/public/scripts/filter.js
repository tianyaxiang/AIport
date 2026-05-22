(() => {
  const main = document.querySelector("[data-cards]");
  const sidebar = document.querySelector("[data-sidebar]");
  const search = document.querySelector("[data-search]");
  const empty = document.querySelector("[data-empty]");
  if (!main || !sidebar) return;

  const cards = Array.from(main.querySelectorAll(".site-card"));

  const state = {
    category: main.getAttribute("data-active-category") || "all",
    query: "",
  };

  const matchCategory = (card) => {
    if (state.category === "all") return true;
    const cats = (card.getAttribute("data-categories") || "")
      .split(",").map((s) => s.trim()).filter(Boolean);
    return cats.includes(state.category);
  };

  const matchQuery = (card) => {
    if (!state.query) return true;
    const txt = card.getAttribute("data-search-text") || "";
    return txt.includes(state.query);
  };

  const apply = () => {
    let visible = 0;
    for (const card of cards) {
      const ok = matchCategory(card) && matchQuery(card);
      if (ok) {
        card.removeAttribute("hidden");
        visible++;
      } else {
        card.setAttribute("hidden", "");
      }
    }
    if (empty) {
      if (visible === 0) empty.removeAttribute("hidden");
      else empty.setAttribute("hidden", "");
    }
  };

  sidebar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    state.category = btn.getAttribute("data-category") || "all";
    main.setAttribute("data-active-category", state.category);
    for (const b of sidebar.querySelectorAll("[data-category]")) {
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    }
    apply();
  });

  if (search) {
    let t;
    search.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.query = search.value.trim().toLowerCase();
        apply();
      }, 300);
    });
  }

  apply();
})();
