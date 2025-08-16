document.getElementById("start").addEventListener("click", () => {
  // Get the links from textarea/input (comma or newline separated)
  const raw = document.getElementById("links").value;
  const links = raw
    .split(/[\n,]+/)         // split by newline or comma
    .map(l => l.trim())       // trim whitespace
    .filter(l => l.length > 0); // remove empty

  // Require at least 3 links
  if (links.length < 3) {
    alert("Please enter at least 3 LinkedIn profile URLs.");
    return;
  }

  // Send links to background.js to open tabs and scrape
  chrome.runtime.sendMessage({ action: "openLinks", links }, (response) => {
    console.log("Sent links to background:", links);
  });
});
