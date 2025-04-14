console.log("Evanto Live Plus Plus By Nathan3197");
console.log("Current URL:", window.location.href);
console.log("Window.Live:", window.Live);

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
      if (match) {
        console.log("Found person name:", match[1]);
        return match[1];
      }
    }
  }
  console.log("Person name not found in scripts");
  return null;
}

// Function to get the controller's name from the UI
function getControllerName() {
  const currentControlElement = document.querySelector('.live-control .current span, .live-control [class*="current"] span');
  if (currentControlElement && currentControlElement.textContent.trim() !== "") {
    const fullText = currentControlElement.textContent.trim();
    console.log("Raw controller text:", fullText);
    const match = fullText.match(/^(\w+)/);
    return match ? match[1] : null;
  }
  console.log("No controller name found");
  return null;
}

// Function to check if an element is visible
function isElementVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const visible = style.display !== 'none' && style.visibility !== 'hidden';
  console.log(`Element visibility check: display=${style.display}, visibility=${style.visibility}, visible=${visible}`);
  return visible;
}

// Function to check if current user is in control
function isCurrentUserInControl() {
  const releaseDiv = document.querySelector('.live-control .release, .live-control [class*="release"]');
  if (!releaseDiv) {
    console.log("No release div found for control check");
    return false;
  }
  const isVisible = isElementVisible(releaseDiv);
  console.log("Is current user in control?", isVisible);
  return isVisible;
}

// Function to check if no one is in control
function isNoOneInControl() {
  const takeControlDiv = document.querySelector('.live-control .take, .live-control [class*="take"]');
  if (!takeControlDiv) {
    console.log("No take div found for control check");
    return false;
  }
  const isVisible = isElementVisible(takeControlDiv);
  console.log("Is no one in control?", isVisible);
  return isVisible;
}

// Function to check Service Manager role
function isServiceManager() {
  const roles = window.elvantoUserRoles || [];
  console.log("Raw roles for Service Manager check:", roles);
  const hasRole = roles.some(role => role && role.toLowerCase() === "service manager");
  console.log(`Is Service Manager? ${hasRole} (roles: ${roles.join(', ') || 'none'})`);
  return hasRole;
}

// Function to correct description styles
function correctDescriptionStyles(elements) {
  elements.forEach(div => {
    if (div.hasAttribute('style')) {
      let styleMap = new Map();
      div.getAttribute('style').split(';').forEach(rule => {
        const [key, value] = rule.split(':').map(s => s.trim());
        if (key && value) styleMap.set(key, value);
      });
      if (styleMap.has('background-color')) {
        console.log(`Removing background-color from div: ${div.textContent.substring(0, 50)}...`);
        styleMap.delete('background-color');
      }
      styleMap.set('color', 'white');
      const newStyle = Array.from(styleMap.entries()).map(([k, v]) => `${k}:${v}`).join(';');
      div.setAttribute('style', newStyle);

      const spans = div.querySelectorAll('span[style]');
      spans.forEach(span => {
        let spanStyleMap = new Map();
        span.getAttribute('style').split(';').forEach(rule => {
          const [key, value] = rule.split(':').map(s => s.trim());
          if (key && value) spanStyleMap.set(key, value);
        });
        if (spanStyleMap.has('color')) {
          console.log(`Removing color from span: ${span.textContent.substring(0, 50)}...`);
          spanStyleMap.delete('color');
        }
        const newSpanStyle = Array.from(spanStyleMap.entries()).map(([k, v]) => `${k}:${v}`).join(';');
        if (newSpanStyle) {
          span.setAttribute('style', newSpanStyle);
        } else {
          span.removeAttribute('style');
        }
      });
    }
  });
}

// Function to create Refresh button
function createRefreshButton(context) {
  const refreshButton = document.createElement('button');
  refreshButton.type = 'button';
  refreshButton.className = 'btn-refresh';
  refreshButton.textContent = 'Refresh';
  refreshButton.setAttribute('data-live-action', 'custom-refresh');

  refreshButton.addEventListener('click', () => {
    if (isCurrentUserInControl() || isServiceManager()) {
      console.log(`Refresh button clicked in ${context}`);
      const confirmed = window.confirm("Are you sure you want to refresh all users web page?");
      if (confirmed) {
        console.log(`Refresh confirmed in ${context}`);
        const chatForm = document.querySelector('.chat-form');
        const chatTextarea = chatForm?.querySelector('textarea[name="chat_text"]');
        if (chatForm && chatTextarea) {
          chatTextarea.value = '/refresh';
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          chatForm.dispatchEvent(submitEvent);
          console.log("Sent /refresh to chat");
        } else {
          console.error("Chat form or textarea not found");
        }
      } else {
        console.log(`Refresh canceled in ${context}`);
      }
    } else {
      console.log(`Refresh button inactive in ${context}: not in control or Service Manager`);
    }
  });

  return refreshButton;
}

// Function to inject Refresh buttons
function injectRefreshButton(liveControlDiv, context, retries = 3) {
  if (!liveControlDiv) {
    console.log(`No live-control div in ${context}, ${retries} retries left`);
    if (retries > 0) {
      setTimeout(() => {
        const retryDiv = document.querySelector(
          context.includes('first')
            ? '.controls-wrapper .live-control'
            : '.overview.content .live-control'
        );
        injectRefreshButton(retryDiv, context, retries - 1);
      }, 500);
    }
    return;
  }

  const currentDiv = liveControlDiv.querySelector('.current, [class*="current"]');
  const takeDiv = liveControlDiv.querySelector('.take, [class*="take"]');
  const releaseDiv = liveControlDiv.querySelector('.release, [class*="release"]');

  if (!currentDiv || !takeDiv) {
    console.log(`Missing current=${!!currentDiv}, take=${!!takeDiv} in ${context}, ${retries} retries left`);
    if (retries > 0) {
      setTimeout(() => injectRefreshButton(liveControlDiv, context, retries - 1), 500);
    }
    return;
  }

  // Inject into .current
  if (!currentDiv.querySelector('.btn-refresh') && isServiceManager()) {
    const refreshButtonCurrent = createRefreshButton(`${context} (current)`);
    // Remove existing span to avoid clutter
    const span = currentDiv.querySelector('span');
    if (span) {
      currentDiv.removeChild(span);
    }
    currentDiv.appendChild(refreshButtonCurrent);
    console.log(`Refresh button injected in ${context} inside current`);
  } else {
    console.log(`Refresh button already exists in ${context} inside current`);
  }

  // Inject into .take
  if (!takeDiv.querySelector('.btn-refresh') && isServiceManager()) {
    const refreshButtonTake = createRefreshButton(`${context} (take)`);
    const takeControlButton = takeDiv.querySelector('button[data-live-action="take-control"]');
    if (takeControlButton && takeControlButton.nextSibling) {
      takeDiv.insertBefore(refreshButtonTake, takeControlButton.nextSibling);
    } else {
      takeDiv.appendChild(refreshButtonTake);
    }
    console.log(`Refresh button injected in ${context} inside take`);
  } else {
    console.log(`Refresh button already exists in ${context} inside take`);
  }

  // inject into .release
  if (!releaseDiv.querySelector('.btn-refresh')) {
    const refreshButtonRelease = createRefreshButton(`${context} (release)`);
    const releaseButton = releaseDiv.querySelector('button[data-live-action="release-control"]');
    if (releaseButton && releaseButton.nextSibling) {
      releaseDiv.insertBefore(refreshButtonRelease, releaseButton.nextSibling);
    } else {
      releaseDiv.appendChild(refreshButtonRelease);
    }
    console.log(`Refresh button injected in ${context} inside release`);
  } else {
    console.log(`Refresh button already exists in ${context} inside release`);
  }
}

// Function to check if DOM is ready
function isDomReady() {
  const liveControl = document.querySelector('.controls-wrapper .live-control');
  const overviewControl = document.querySelector('.overview.content .live-control');
  const chatContainer = document.querySelector('.chat .content ol');
  console.log(`DOM check: liveControl=${!!liveControl}, overviewControl=${!!overviewControl}, chatContainer=${!!chatContainer}`);
  return liveControl && overviewControl && chatContainer;
}

// Function to initialize the extension
function initExtension(retries = 10) {
  if (!isDomReady() && retries > 0) {
    console.log(`DOM not ready, retrying (${retries} left)...`);
    setTimeout(() => initExtension(retries - 1), 500);
    return;
  }
  if (!isDomReady()) {
    console.error("DOM not ready after retries, exiting");
    return;
  }

  const personName = getPersonNameFromPage();
  if (!personName && retries > 0) {
    console.log(`Person name not found, retrying (${retries} left)...`);
    setTimeout(() => initExtension(retries - 1), 500);
    return;
  }
  if (!personName) {
    console.error("Person name not found after retries, exiting");
    return;
  }
  console.log("Current user's name:", personName);

  const username = personName;
  const nameParts = username.split(' ');
  const firstName = nameParts[0].toLowerCase();
  const lastName = nameParts[nameParts.length - 1].toLowerCase();
  const fullMention = `${firstName}${lastName}`;

  // Get user's roles and transform them for mentions
  const userRoles = window.elvantoUserRoles || [];
  console.log("User roles:", userRoles);
  const roleMentionNames = userRoles.map(role => role.toLowerCase().replace(/\s+/g, ''));

  // Combine all mention targets: personal, all/everyone, and roles
  const mentionTargets = ['all', 'everyone', firstName, lastName, fullMention, ...roleMentionNames];
  const mentionRegex = new RegExp(`\\B@(${mentionTargets.join('|')})\\b`, 'i');
  console.log("Mention regex pattern:", mentionRegex);

  // Inject Refresh buttons
  injectRefreshButton(
    document.querySelector('.controls-wrapper .live-control'),
    'first live-control'
  );
  injectRefreshButton(
    document.querySelector('.overview.content .live-control'),
    'overview live-control'
  );

  // Correct description styles
  const descriptionDivs = document.querySelectorAll('.plan.content .description-description div[style]');
  correctDescriptionStyles(descriptionDivs);

  // Function to check mentions in initial messages
  const checkMessagesForMentions = (messages) => {
    messages.forEach(message => {
      const messageText = message.textContent.trim();
      if (mentionRegex.test(messageText)) {
        message.classList.add('mentioned');
        console.log(`Highlighted mention: ${messageText}`);
      }
    });
  };

  // Function to check commands and mentions in new messages
  const checkMessagesForCommands = (messages) => {
    messages.forEach(message => {
      const messageText = message.textContent.trim();
      const liElement = message.closest('li');
      if (liElement) {
        const senderNameRaw = liElement.querySelector('.name')?.textContent.split(' - ')[0]?.trim();
        if (!senderNameRaw) {
          console.log("Sender name not found in message");
          return;
        }
        const senderName = senderNameRaw.replace(/\s+/g, ' ').trim();
        const senderFirstName = senderName.split(' ')[0];
        console.log(`Message: ${messageText}, Sender: ${senderName}, Current user: ${personName}`);

        if (messageText.toLowerCase() === "/refresh") {
          if (isNoOneInControl() && !isCurrentUserInControl() && !isServiceManager()) {
            console.log("Ignoring /refresh: no one in control and not Service Manager");
            return;
          }
          if (isCurrentUserInControl() || isServiceManager()) {
            const normalizedSender = senderName.replace(/,\s*/g, ' ').trim();
            const normalizedPerson = personName.replace(/,\s*/g, ' ').trim();
            if (normalizedSender === normalizedPerson) {
              console.log("Refresh command from controller/Service Manager, reloading...");
              location.reload();
            } else {
              console.log("Ignoring /refresh: sender does not match current user");
            }
          } else {
            const controllerFirstName = getControllerName();
            if (controllerFirstName && senderFirstName === controllerFirstName) {
              console.log("Refresh command from controller, reloading...");
              location.reload();
            } else {
              console.log("Ignoring /refresh: sender not controller");
            }
          }
        } else if (mentionRegex.test(messageText)) {
          message.classList.add('mentioned');
          console.log(`Highlighted mention: ${messageText}`);
        }
      }
    });
  };

  // Highlight existing messages
  const chatContainer = document.querySelector('.chat .content ol');
  const initialMessages = chatContainer.querySelectorAll('div.text');
  checkMessagesForMentions(initialMessages);

  // Monitor new messages
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

  observer.observe(chatContainer, { childList: true, subtree: true });
  console.log("Chat observer started");
}

// Start initialization
const startExtension = (retries = 10) => {
  if (typeof window.elvantoUserRoles !== 'undefined' && isDomReady()) {
    console.log("Roles and DOM ready, initializing extension:", window.elvantoUserRoles);
    initExtension();
  } else {
    console.log(`Waiting for roles=${typeof window.elvantoUserRoles}, DOM=${isDomReady()}, ${retries} retries left...`);
    if (retries > 0) {
      setTimeout(() => startExtension(retries - 1), 500);
    } else {
      console.error("Roles or DOM not ready after retries, initializing anyway");
      initExtension();
    }
  }
};

startExtension();