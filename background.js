// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchEmojis') {
    fetch('https://emoji.gg/api')
      .then(response => response.json())
      .then(data => sendResponse({data}))
      .catch(error => sendResponse({error: error.message}));
    return true; // Keep the message channel open for async response
  }
});