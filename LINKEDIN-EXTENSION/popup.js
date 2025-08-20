document.addEventListener("DOMContentLoaded", () => {
  const likeInput = document.getElementById("likeCount");
  const commentInput = document.getElementById("commentCount");
  const startBtn = document.getElementById("startBtn");
  const likesProcessedSpan = document.getElementById("likesProcessed");
  const commentsProcessedSpan = document.getElementById("commentsProcessed");

  // Enable/disable start button based on inputs
  function checkInputs() {
    const likeValue = parseInt(likeInput.value) || 0;
    const commentValue = parseInt(commentInput.value) || 0;
    startBtn.disabled = likeValue === 0 && commentValue === 0;
  }

  likeInput.addEventListener("input", checkInputs);
  commentInput.addEventListener("input", checkInputs);

  // Start button
  startBtn.addEventListener("click", () => {
    const likeCount = parseInt(likeInput.value) || 0;
    const commentCount = parseInt(commentInput.value) || 0;

    if (likeCount === 0 && commentCount === 0) {
      alert('Please enter at least one like or comment count');
      return;
    }

    // Update button state
    startBtn.disabled = true;
    startBtn.textContent = 'Processing...';

    chrome.tabs.create({ url: "https://www.linkedin.com/feed/" }, (tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [likeCount, commentCount],
        func: async (likeCount, commentCount) => {

          const sleep = ms => new Promise(res => setTimeout(res, ms));

          // Comment function
          async function commentPost(post, text) {
            const commentBtn = post.querySelector('button[aria-label*="Comment"]');
            if (!commentBtn) return false;
            commentBtn.click();
            await sleep(800);

            // Try multiple selectors for comment box
            let commentBox = post.querySelector('.comments-comment-box__contenteditable[role="textbox"]') ||
                           post.querySelector('div[role="textbox"]') ||
                           post.querySelector('[contenteditable="true"]') ||
                           post.querySelector('textarea');
            
            if (!commentBox) {
              // Look for comment box that just appeared anywhere on page
              const allBoxes = document.querySelectorAll('[contenteditable="true"], div[role="textbox"], textarea');
              commentBox = allBoxes[allBoxes.length - 1]; // Get the most recent one
            }
            
            if (!commentBox) return false;

            commentBox.focus();
            await sleep(200);

            // Clear and set text using modern methods
            commentBox.innerHTML = "";
            commentBox.textContent = "";
            if (commentBox.value !== undefined) commentBox.value = "";
            
            await sleep(100);

            // Set the comment text
            if (commentBox.contentEditable === 'true') {
              commentBox.innerHTML = text;
              commentBox.textContent = text;
            } else {
              commentBox.value = text;
            }

            // Trigger modern input events
            commentBox.dispatchEvent(new InputEvent("input", { 
              bubbles: true, 
              cancelable: true,
              inputType: 'insertText',
              data: text
            }));
            commentBox.dispatchEvent(new Event("change", { bubbles: true }));
            
            await sleep(500);

            // Try to find and click submit button
            let submitBtn = post.querySelector('button.comments-comment-box__submit-button--cr') ||
                          post.querySelector('button[data-control-name*="comment_submit"]') ||
                          document.querySelector('button.comments-comment-box__submit-button--cr');
            
            if (submitBtn) {
              submitBtn.click();
              await sleep(800);
              return true;
            }

            // Fallback: Submit comment by pressing Enter
            const enterEvent = new KeyboardEvent("keydown", {
              bubbles: true,
              cancelable: true,
              key: "Enter",
              code: "Enter",
            });
            commentBox.dispatchEvent(enterEvent);

            await sleep(800);
            return true;
          }

          let likeDone = 0, commentDone = 0;
          const commentedPosts = new Set();

          while (likeDone < likeCount || commentDone < commentCount) {
            const posts = document.querySelectorAll("div.feed-shared-update-v2");
            if (!posts.length) break;

            for (let post of posts) {
              // Skip reposts
              const isRepost = post.querySelector('span.feed-shared-actor__sub-description');
              if (isRepost && isRepost.innerText.includes("reposted")) continue;

              // Like
              const likeBtn = post.querySelector('button[aria-label*="Like"]');
              if (likeBtn && likeBtn.getAttribute("aria-pressed") !== "true" && likeDone < likeCount) {
                likeBtn.scrollIntoView({ behavior: "smooth", block: "center" });
                likeBtn.click();
                likeDone++;
                await sleep(Math.floor(Math.random() * 800) + 600);
              }

              // Comment (only if not already commented)
              if (commentDone < commentCount && !commentedPosts.has(post)) {
                const success = await commentPost(post, "CFBR");
                if (success) {
                  commentDone++;
                  commentedPosts.add(post);
                }
                await sleep(Math.floor(Math.random() * 1000) + 800);
              }

              if (likeDone >= likeCount && commentDone >= commentCount) break;
            }

            // Scroll feed
            window.scrollBy(0, window.innerHeight);
            await sleep(1200);
          }

          console.log(`Done: Liked ${likeDone} posts, commented on ${commentDone} posts.`);
          alert(`Done: Liked ${likeDone} posts, commented on ${commentDone} posts.`);
        }
      }).then(() => {
        // Update stats
        likesProcessedSpan.textContent = likeCount;
        commentsProcessedSpan.textContent = commentCount;

        // Reset button
        startBtn.disabled = false;
        startBtn.textContent = 'Start Interaction';
        checkInputs();
      }).catch((error) => {
        console.error('Error:', error);
        alert('Error occurred. Please try again.');
        
        // Reset button on error
        startBtn.disabled = false;
        startBtn.textContent = 'Start Interaction';
        checkInputs();
      });
    });
  });
});