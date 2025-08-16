
(function () {

  if (window.__linkedin_scraper_ran) {
    console.log("content.js: scraper already ran on this page, exiting.");
    return;
  }
  window.__linkedin_scraper_ran = true;

  if (!/linkedin\.com\/in\//i.test(window.location.href)) {
    console.log("content.js: not a LinkedIn profile page — exiting.");
    return;
  }
  console.log("content.js: starting scrape for", window.location.href);


  function getText(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const txt = el.innerText || el.textContent;
          if (txt && txt.trim().length) return txt.trim();
        }
      } catch (e) { /* ignore invalid selectors */ }
    }
    return null;
  }

  // click "See more" buttons to expandw about/summary if present
  function clickSeeMore() {
    try {
      // prefer buttons inside about/summary but fallback to any "See more"
      const aboutBtn = Array.from(document.querySelectorAll('button')).find(b =>
        /see more|see more·|see more…/i.test(b.innerText)
      );
      if (aboutBtn) {
        aboutBtn.click();
        console.log("content.js: clicked 'See more'");
      }
    } catch (e) { /* ignore */ }
  }

  // extract first non-empty line from text
  function firstLine(text) {
    if (!text) return null;
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return lines.length ? lines[0] : null;
  }

  // parse a number from page body using regex (handles commas)
  function parseNumber(patterns) {
    const body = document.body.innerText || "";
    for (const p of patterns) {
      const m = body.match(p);
      if (m && m[1]) {
        return parseInt(m[1].replace(/,/g, ""), 10);
      }
    }
    return null;
  }

  function scrapeOnce() {
    // Try to expand summary to ensure full text is available
    clickSeeMore();

   const name = getText([
  "h1.text-heading-xlarge",
  "div.ph5.pb5 h1",
  ".pv-text-details__left-panel h1",
  "header h1"
]);


    const bio = getText([
      ".pv-text-details__left-panel .text-body-medium",
      ".text-body-medium.break-words",
      ".top-card__subline-item",
      ".top-card-layout__headline",
      ".pv-top-card--list li"
    ]);

    const location = getText([
      ".pv-text-details__left-panel .text-body-small.inline.t-black--light",
      ".pv-text-details__left-panel .text-body-small.inline",
      ".top-card__subline-item--bullet",
      ".text-body-small.inline",
      ".pv-top-card--list-bullet"
    ]);

 // ...existing code...
const about = getText([
  ".pv-about-section .pv-shared-text-with-see-more",
  ".pv-shared-text-with-see-more .break-words",
  ".pv-shared-text-with-see-more__text",
  ".artdeco-card .break-words",
  ".artdeco-card p",
  ".about .text-body-medium",
  ".about-section .text-body-medium",
  ".pv-about__summary-text"
]);
// ...existing code...

    const bioLine = firstLine(about) || firstLine(bio) || null;

    // follower & connection counts — try multiple patterns
    const followerCount = parseNumber([/([\d,]+)\s+followers/i, /Followers\s*·\s*([\d,]+)/i]);
    const connectionCount = parseNumber([/([\d,]+)\s+connections/i,
                                         /([\d,]+)\s+connections? in your network/i,
                                         /([\d,]+)\s+followers and ([\d,]+)\s+connections/i /* fallback */]);

    const payload = {
      name: name || null,
      url: window.location.href,
      about: about || null,
      bio: bio || null,
      location: location || null,
      followerCount: followerCount === null ? null : followerCount,
      connectionCount: connectionCount === null ? null : connectionCount,
      bioLine: bioLine || null
    };

    console.log("content.js: scraped ->", payload);

    // require at least url, and preferably name; change validation if you want to require name
    if (!payload.url) {
      console.warn("content.js: no url found — aborting send", payload);
      return;
    }

    // Send scraped data to background service worker
    chrome.runtime.sendMessage({ action: "scrapedProfile", data: payload }, (resp) => {
      if (chrome.runtime.lastError) {
        console.warn("content.js: error sending message to background:", chrome.runtime.lastError);
      } else {
        console.log("content.js: scrapedProfile message sent; background replied:", resp);
      }
      // After sending, ask background to close this tab (background can use sender.tab.id)
      // If you don't want the tab to auto-close, remove the next call.
      chrome.runtime.sendMessage({ action: "closeTab" }, (r) => {
        if (chrome.runtime.lastError) {
          // background may not implement closeTab — that's okay
          // console.warn("content.js: closeTab message failed:", chrome.runtime.lastError);
        } else {
          console.log("content.js: requested background to close tab:", r);
        }
      });
    });
  }

  // Wait for name element — retry up to N times because LinkedIn loads content dynamically
  function waitForName(attempt = 0) {
  // Try more selectors for robustness
  const nameEl =
    document.querySelector("h1.text-heading-xlarge") ||
    document.querySelector(".pv-text-details__left-panel h1") ||
    document.querySelector("div.ph5.pb5 h1") ||
    document.querySelector("header h1");

  if (nameEl && (nameEl.innerText || nameEl.textContent).trim().length > 0) {
    console.log("content.js: found name element:", nameEl.innerText || nameEl.textContent);
    // Increase delay to 1500ms for more reliable scraping
    setTimeout(scrapeOnce, 1500);
  } else if (attempt < 15) {
    console.log("content.js: waiting for name element (attempt " + (attempt + 1) + ")");
    setTimeout(() => waitForName(attempt + 1), 1200);
  } else {
    console.warn("content.js: timed out waiting for name — attempting scrape anyway");
    scrapeOnce();
  }
}

waitForName();
})();
