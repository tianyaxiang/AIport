const HOSTS = [
  "http://localhost:4321/",
  "https://aiport.example.com/",
];

const isNavPage = (url) => !!url && HOSTS.some((h) => url.startsWith(h));

const flashBadge = async (text) => {
  await chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
};

const confirmInPage = async (tabId, count) => {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (n) => window.confirm(`将打开 ${n} 个标签页，确认继续？`),
    args: [count],
  });
  return result === true;
};

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  if (!isNavPage(tab.url)) {
    await chrome.tabs.create({ url: HOSTS[HOSTS.length - 1] });
    return;
  }
  let resp;
  try {
    resp = await chrome.tabs.sendMessage(tab.id, { type: "collect" });
  } catch (_) {
    await flashBadge("!");
    return;
  }
  const urls = (resp && resp.urls) || [];
  if (urls.length === 0) {
    await flashBadge("0");
    return;
  }
  if (urls.length > 20) {
    const ok = await confirmInPage(tab.id, urls.length);
    if (!ok) return;
  }
  for (const url of urls) {
    chrome.tabs.create({ url, active: false });
  }
});
