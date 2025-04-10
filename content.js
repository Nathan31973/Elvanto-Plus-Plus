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

// Function to get the controller's name from the UI (when someone else is in control)
function getControllerName() {
  const currentControlElement = document.querySelector('.live-control .current span');
  if (currentControlElement && currentControlElement.textContent.trim() !== "") {
    const fullText = currentControlElement.textContent.trim();
    console.log("Raw controller text from .current span:", fullText);
    // Extract first name from "<first name> is in Control"
    const match = fullText.match(/^(\w+)/);
    return match ? match[1] : null;
  }
  return null;
}

// Function to check if an element is truly visible using computed style
function isElementVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

// Function to check if the current user is in control
function isCurrentUserInControl() {
  const releaseDiv = document.querySelector('.live-control .release');
  const isVisible = isElementVisible(releaseDiv);
  console.log("Is current user in control? .release computed display:", isVisible ? 'visible' : 'hidden');
  return isVisible;
}

// Function to check if no one is in control (based on "Take Control")
function isNoOneInControl() {
  const takeControlDiv = document.querySelector('.live-control .take');
  const isVisible = isElementVisible(takeControlDiv);
  console.log("Is no one in control? .take computed display:", isVisible ? 'visible' : 'hidden');
  return isVisible;
}

// Function to initialize the extension logic
function initExtension() {
  let personName = getPersonNameFromPage();
  if (!personName) {
    console.log("Person name not found, retrying...");
    setTimeout(initExtension, 500);
    return;
  }
  console.log("Current user's name:", personName);

  const username = personName;
  const nameParts = username.split(' ');
  const firstName = nameParts[0].toLowerCase(); // e.g., "nathan"
  const lastName = nameParts[nameParts.length - 1].toLowerCase(); // e.g., "poulton"
  const fullMention = `@${firstName}${lastName}`; // e.g., "@nathanpoulton"

  // Regex to match @mentions (case-insensitive)
  const mentionRegex = new RegExp(`\\B@(${firstName}|${lastName}|${firstName}${lastName})\\b`, 'i');

  // Find the chat container
  const chatContainer = document.querySelector('.chat .content ol');
  if (!chatContainer) {
    console.error('Could not find chat container');
    return;
  }

  // Function to check and process messages (for mentions only in initial scan)
  const checkMessagesForMentions = (messages) => {
    messages.forEach(message => {
      const messageText = message.textContent.trim();
      if (mentionRegex.test(messageText)) {
        message.classList.add('mentioned');
      }
    });
  };

  // Function to check messages for "/refresh" and mentions (for new messages)
  const checkMessagesForCommands = (messages) => {
    messages.forEach(message => {
      const messageText = message.textContent.trim();
      const liElement = message.closest('li');
      if (liElement) {
        const senderNameRaw = liElement.querySelector('.name').textContent.split(' - ')[0].trim();
        const senderName = senderNameRaw.replace(/\s+/g, ' ').trim(); // Normalize spaces
        const senderFirstName = senderName.split(' ')[0]; // Extract sender's first name
        console.log("Sender name:", senderName, "| Current user name:", personName);

        if (messageText === "/refresh") {
          if (isNoOneInControl() && !isCurrentUserInControl()) {
            console.log("No one is in control (.take visible, .release hidden), ignoring /refresh");
            return;
          }
          if (isCurrentUserInControl()) {
            if (senderName === personName) {
              console.log("Refresh command from controller (current user), refreshing...");
              location.reload();
            } else {
              console.log("Refresh command ignored: sender does not match current user");
            }
          } else {
            const controllerFirstName = getControllerName();
            console.log("Controller first name from UI:", controllerFirstName);
            if (controllerFirstName && senderFirstName === controllerFirstName) {
              console.log("Refresh command from controller, refreshing...");
              location.reload();
            } else {
              console.log("Refresh command ignored: sender is not in control");
            }
          }
        } else if (mentionRegex.test(messageText)) {
          message.classList.add('mentioned');
        }
      }
    });
  };

  // Highlight existing messages for mentions only (skip /refresh)
  const initialMessages = chatContainer.querySelectorAll('div.text');
  checkMessagesForMentions(initialMessages);

  // Monitor new messages with MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('text')) {
              checkMessagesForCommands([node]);
            } else {
              const newMessages = node.querySelectorAll('div.text');
              checkMessagesForCommands(newMessages);
            }
          }
        });
      }
    });
  });

  // Start observing the chat container
  observer.observe(chatContainer, { childList: true, subtree: true });
}

initExtension();
