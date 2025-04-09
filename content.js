console.log("Evanto Live Plus Plus By Nathan3197");
console.log("Current URL:", window.location.href);
console.log(window.Live);
if (window.location.href.match(/^https:\/\/.*\.elvanto\.com\.au\/live\//)) {
    console.log("Elvanto live page matched!");
} else {
    console.log("Not matching Elvanto live page.");
}

function getPersonNameFromPage() {
  const scripts = document.getElementsByTagName('script');
  for (let script of scripts) {
    if (script.textContent.includes('Live.init')) {
      const match = script.textContent.match(/"person_name":"([^"]+)"/);
      if (match) return match[1];
    }
  }
  return null;
}



initExtension();
// Function to initialize the extension logic
function initExtension() {
    // Verify that window.Live and window.Live.personName exist
    let personName = window.Live && window.Live.personName ? window.Live.personName : getPersonNameFromPage();
    if (personName) {
      // Get the username and remove spaces
      const username = personName;
      const nameParts = username.split(' ');
      const firstName = nameParts[0].toLowerCase(); // e.g., "nathan"
      const lastName = nameParts[nameParts.length - 1].toLowerCase(); // e.g., "poulton"
      const fullMention = `@${firstName}${lastName}`; // e.g., "@nathanpoulton"
    
      // Regex to match @mentions (case-insensitive)
      const mentionRegex = new RegExp(`\\B@(${firstName}|${lastName}|${firstName}${lastName})\\b`,'i');
      // Find the chat container
      const chatContainer = document.querySelector('.chat .content ol');
      if (!chatContainer) {
        console.error('Could not find chat container');
        return;
      }
  
      // Function to check and highlight mention messages
      const checkMessages = (messages) => {
        messages.forEach(message => {
          if (mentionRegex.test(message.textContent)) {
            message.classList.add('mentioned');
          }
        });
      };
  
      // Highlight existing messages
      const initialMessages = chatContainer.querySelectorAll('div.text');
      checkMessages(initialMessages);
  
      // Monitor new messages with MutationObserver
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList.contains('text')) {
                  checkMessages([node]);
                } else {
                  const newMessages = node.querySelectorAll('div.text');
                  checkMessages(newMessages);
                }
              }
            });
          }
        });
      });
  
      // Start observing the chat container
      observer.observe(chatContainer, { childList: true, subtree: true });
    } else {
      console.log("Person name not found, retrying...");
      setTimeout(initExtension, 500);
      return;
    }
  }
  
  // Wait for the DOM to load
  document.addEventListener('DOMContentLoaded', () => {
    // Check if window.Live is ready immediately
    if (window.Live && window.Live.personName) {
      initExtension();
    } else {
      // Poll every 500ms until window.Live is available
      const interval = setInterval(() => {
        if (window.Live && window.Live.personName) {
          clearInterval(interval);
          initExtension();
        }
      }, 500);
    }
  });