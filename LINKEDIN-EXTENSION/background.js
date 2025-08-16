
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {

    if (message.action === "openLinks" && Array.isArray(message.links)) {
      const rawLinks = message.links.map(l => (l || "").trim()).filter(Boolean);

      // require at least 3 links
      if (rawLinks.length < 3) {
        console.warn("background: need at least 3 valid LinkedIn links. Got:", rawLinks.length);
        // Optionally notify popup (not implemented here)
        return;
      }

      console.log("background: launching scrape for links:", rawLinks);

      // stagger openings so LinkedIn has time to render
      rawLinks.forEach((url, idx) => {
        setTimeout(() => {
          chrome.tabs.create({ url, active: true }, (tab) => {
            if (!tab || !tab.id) {
              console.error("background: failed to create tab for", url);
              return;
            }

            // give page some time to load, then inject content.js to scrape
            // (adjust delay if pages need more time to render)
            setTimeout(() => {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
              }).then(() => {
                console.log("background: injected scraper into tab", tab.id, url);
              }).catch(err => {
                console.error("background: injection failed for tab", tab.id, url, err);
              });
            }, 4500);
          });
        }, idx * 9000); // 9s gap between profile openings (tweak as needed)
      });

      return; // done handling openLinks
    }

    // --- 2) Receive scraped data from content script and POST to backend ---
    if (message.action === "scrapedProfile" && message.data) {
      const payload = message.data;

      // basic validation: require url (and ideally name)
      if (!payload || !payload.url || payload.url.trim().length === 0) {
        console.warn("background: received scrapedProfile with missing url, skipping:", payload);
        return;
      }

      // normalize undefined values -> null
      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) payload[k] = null;
      });

      console.log("background: posting scraped profile to backend:", payload.url, "name:", payload.name);

      fetch("http://127.0.0.1:5000/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(json => {
        console.log("background: saved to backend:", json);
        // Optionally you can send a message back to the content script or popup
        // to indicate success: chrome.tabs.sendMessage(tabId, { action: "saved", id: json.id });
      })
      .catch(err => {
        console.error("background: error saving to backend:", err);
      });

      return;
    }
  } catch (e) {
    console.error("background: unexpected error in onMessage listener:", e);
  }
});
