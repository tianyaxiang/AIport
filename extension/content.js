chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "collect") {
    const cards = document.querySelectorAll(".site-card:not([hidden])");
    const urls = [];
    for (const card of cards) {
      const u = card.getAttribute("data-site-url");
      if (u) urls.push(u);
    }
    sendResponse({ urls });
    return true;
  }
});
