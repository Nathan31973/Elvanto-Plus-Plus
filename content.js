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
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("Found person name:", match[1]);
        }
        return match[1];
      }
    }
  }
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("Person name not found in scripts");
  }
  return null;
}

// Function to get the controller's name from the UI
function getControllerName() {
  const currentControlElement = document.querySelector('.live-control .current span, .live-control [class*="current"] span');
  if (currentControlElement && currentControlElement.textContent.trim() !== "") {
    const fullText = currentControlElement.textContent.trim();
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Raw controller text:", fullText);
    }
    const match = fullText.match(/^(\w+)/);
    return match ? match[1] : null;
  }
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("No controller name found");
  }
  return null;
}

// Function to check if an element is visible
function isElementVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const visible = style.display !== 'none' && style.visibility !== 'hidden';
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Element visibility check: display=${style.display}, visibility=${style.visibility}, visible=${visible}`);
  }
  return visible;
}

// Function to check if current user is in control
function isCurrentUserInControl() {
  const releaseDiv = document.querySelector('.live-control .release, .live-control [class*="release"]');
  if (!releaseDiv) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("No release div found for control check");
    }
    return false;
  }
  const isVisible = isElementVisible(releaseDiv);
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("Is current user in control?", isVisible);
  }
  return isVisible;
}

// Function to check if no one is in control
function isNoOneInControl() {
  const takeControlDiv = document.querySelector('.live-control .take, .live-control [class*="take"]');
  if (!takeControlDiv) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("No take div found for control check");
    }
    return false;
  }
  const isVisible = isElementVisible(takeControlDiv);
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("Is no one in control?", isVisible);
  }
  return isVisible;
}

// Function to normalize role names for matching
function normalizeRoleName(role) {
  return role ? role.toLowerCase().replace(/\s+/g, '') : '';
}

// Function to determine if a user can use a feature based on kill switches and permissions
function canUseFeature(featureType, featureName, roles) {
  try {
    // Check kill switch first (highest priority)
    if (!window.isFeatureEnabled || !window.isFeatureEnabled(featureType, featureName)) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Feature ${featureType}:${featureName} disabled by kill switch`);
      }
      return false;
    }

    // Default to empty roles if not provided
    const userRoles = Array.isArray(roles) ? [...roles] : [];
    // Add InControl if applicable
    if (isCurrentUserInControl()) {
      userRoles.push("InControl");
    }
    // Always include Everyone
    userRoles.push("Everyone");

    // Log raw roles, permissions, and localStorage for debugging
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Raw user roles: ${roles ? roles.join(', ') : 'undefined'}`);
      console.log(`Processed user roles: ${userRoles.join(', ')}`);
      console.log(`Available permission roles: ${window.permissions && window.permissions.Roles ? Object.keys(window.permissions.Roles).join(', ') : 'none'}`);
      console.log(`localStorage.elvantoRoles: ${localStorage.getItem('elvantoRoles') || 'empty'}`);
      console.log(`Permissions structure: ${JSON.stringify(window.permissions, null, 2)}`);
    }

    // Check if permissions are loaded
    if (!window.permissions || !window.permissions.Roles) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.warn(`No permissions loaded for ${featureType}:${featureName}, denying access`);
      }
      return false;
    }

    // Filter roles that exist in permissions and get their priorities
    const validRoles = userRoles.filter(role => window.permissions.Roles[role]);
    if (validRoles.length === 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`No valid roles found for ${featureType}:${featureName}, denying access`);
      }
      return false;
    }

    // Find the role with the highest priority (lowest Priority number)
    const rolePriorities = validRoles.map(role => ({
      role,
      priority: (window.permissions.Roles[role] && window.permissions.Roles[role].Priority) || 99
    }));
    const highestPriorityRole = rolePriorities.reduce((highest, current) =>
      current.priority < highest.priority ? current : highest,
      rolePriorities[0]
    );

    // Check permission for the highest-priority role
    const hasAccess = window.hasPermission(highestPriorityRole.role, featureType, featureName);
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(
        `Permission check for ${featureType}:${featureName}, ` +
        `roles: [${userRoles.join(', ')}], ` +
        `highest priority role: ${highestPriorityRole.role} (priority ${highestPriorityRole.priority}), ` +
        `access: ${hasAccess}`
      );
    }
    return hasAccess;
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error(`Error in canUseFeature(${featureType}, ${featureName}):`, error);
    }
    return false;
  }
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
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log(`Removing background-color from div: ${div.textContent.substring(0, 50)}...`);
        }
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
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Removing color from span: ${span.textContent.substring(0, 50)}...`);
          }
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
    if (canUseFeature("Button", "Refresh", window.elvantoUserRoles)) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Refresh button clicked in ${context}`);
      }
      const confirmed = window.confirm("Are you sure you want to refresh all users web page?");
      if (confirmed) {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log(`Refresh confirmed in ${context}`);
        }
        const chatForm = document.querySelector('.chat-form');
        const chatTextarea = chatForm?.querySelector('textarea[name="chat_text"]');
        if (chatForm && chatTextarea) {
          chatTextarea.value = '/refresh';
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          chatForm.dispatchEvent(submitEvent);
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Sent /refresh to chat");
          }
        } else {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.error("Chat form or textarea not found");
          }
        }
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log(`Refresh canceled in ${context}`);
        }
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Refresh button inactive in ${context}: user lacks permission`);
      }
    }
  });

  return refreshButton;
}

// Function to inject Refresh buttons
function injectRefreshButton(liveControlDiv, context, retries = 3) {
  if (!canUseFeature("Button", "Refresh", window.elvantoUserRoles)) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button disabled by permissions or kill switch in ${context}`);
    }
    return;
  }

  if (!liveControlDiv) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`No live-control div in ${context}, ${retries} retries left`);
    }
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
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Missing current=${!!currentDiv}, take=${!!takeDiv} in ${context}, ${retries} retries left`);
    }
    if (retries > 0) {
      setTimeout(() => injectRefreshButton(liveControlDiv, context, retries - 1), 500);
    }
    return;
  }

  // Inject into .current
  if (!currentDiv.querySelector('.btn-refresh')) {
    const refreshButtonCurrent = createRefreshButton(`${context} (current)`);
    currentDiv.appendChild(refreshButtonCurrent);
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button injected in ${context} inside current`);
    }
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button already exists in ${context} inside current`);
    }
  }

  // Inject into .take
  if (!takeDiv.querySelector('.btn-refresh')) {
    const refreshButtonTake = createRefreshButton(`${context} (take)`);
    const takeControlButton = takeDiv.querySelector('button[data-live-action="take-control"]');
    if (takeControlButton && takeControlButton.nextSibling) {
      takeDiv.insertBefore(refreshButtonTake, takeControlButton.nextSibling);
    } else {
      takeDiv.appendChild(refreshButtonTake);
    }
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button injected in ${context} inside take`);
    }
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button already exists in ${context} inside take`);
    }
  }

  // Inject into .release
  if (!releaseDiv.querySelector('.btn-refresh')) {
    const refreshButtonRelease = createRefreshButton(`${context} (release)`);
    const releaseButton = releaseDiv.querySelector('button[data-live-action="release-control"]');
    if (releaseButton && releaseButton.nextSibling) {
      releaseDiv.insertBefore(refreshButtonRelease, releaseButton.nextSibling);
    } else {
      releaseDiv.appendChild(refreshButtonRelease);
    }
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button injected in ${context} inside release`);
    }
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button already exists in ${context} inside release`);
    }
  }
}

// Function to check if DOM is ready
function isDomReady() {
  const liveControl = document.querySelector('.controls-wrapper .live-control');
  const overviewControl = document.querySelector('.overview.content .live-control');
  const chatContainer = document.querySelector('.chat .content ol');
  const dropdownMenu = document.querySelector('ul.dropdown-menu.dropdown-menu-right');
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`DOM check: liveControl=${!!liveControl}, overviewControl=${!!overviewControl}, chatContainer=${!!chatContainer}, dropdownMenu=${!!dropdownMenu}`);
  }
  return liveControl && overviewControl && chatContainer && dropdownMenu;
}

// Function to request notification permission
function requestNotificationPermission() {
  if (!window.isFeatureEnabled || !window.isFeatureEnabled("Notification")) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Notifications disabled by kill switch");
    }
    return Promise.resolve(false);
  }

  if (!('Notification' in window)) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log('Notification API not supported in this browser');
    }
    return Promise.resolve(false);
  }

  return Notification.requestPermission().then(permission => {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Notification permission status: ${permission}`);
    }
    return permission === 'granted';
  }).catch(err => {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error('Error requesting notification permission:', err);
    }
    return false;
  });
}

// Function to show a notification
let notificationsEnabled = false; // Track notification toggle state
function showNotification(title, options) {
  if (!window.isFeatureEnabled || !window.isFeatureEnabled("Notification")) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Notifications disabled by kill switch");
    }
    return;
  }

  if (!('Notification' in window)) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log('Notification API not supported');
    }
    return;
  }

  if (Notification.permission === 'granted' && notificationsEnabled) {
    try {
      new Notification(title, options);
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Notification shown: ${title}`);
      }
    } catch (err) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error('Error showing notification:', err);
      }
    }
  } else if (Notification.permission !== 'denied' && notificationsEnabled) {
    // Request permission if not yet granted or denied
    requestNotificationPermission().then(granted => {
      if (granted) {
        try {
          new Notification(title, options);
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Notification shown after permission granted: ${title}`);
          }
        } catch (err) {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.error('Error showing notification after permission:', err);
          }
        }
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log('Notification permission not granted');
        }
      }
    });
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log('Notifications not shown: permission denied or toggle off');
    }
  }
}

// Function to create the Last Refresh element
function createLastRefreshElement() {
  if (!window.isFeatureEnabled || !window.isFeatureEnabled("LastRefresh")) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("LastRefresh disabled by kill switch");
    }
    return null;
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const div = document.createElement('div');
  div.className = 'last-refresh';
  div.textContent = `Last Runsheet Update: ${timeString}`;
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Created LastRefresh element: ${div.textContent}`);
  }
  return div;
}

// Function to initialize the extension
function initExtension(retries = 10) {
  try {
    if (!window.isFeatureEnabled || !window.isFeatureEnabled("Plugin")) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Plugin disabled by kill switch");
      }
      return;
    }

    if (!isDomReady() && retries > 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`DOM not ready, retrying (${retries} left)...`);
      }
      setTimeout(() => initExtension(retries - 1), 500);
      return;
    }
    if (!isDomReady()) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error("DOM not ready after retries, exiting");
      }
      return;
    }

    const personName = getPersonNameFromPage();
    if (!personName && retries > 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Person name not found, retrying (${retries} left)...`);
      }
      setTimeout(() => initExtension(retries - 1), 500);
      return;
    }
    if (!personName) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error("Person name not found after retries, exiting");
      }
      return;
    }
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Current user's name:", personName);
    }

    // Check if roles are loaded
    if (typeof window.elvantoUserRoles === 'undefined' && retries > 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Roles not loaded, retrying (${retries} left)...`);
      }
      setTimeout(() => initExtension(retries - 1), 500);
      return;
    }
    if (typeof window.elvantoUserRoles === 'undefined') {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.warn("Roles not loaded after retries, defaulting to empty array");
      }
      window.elvantoUserRoles = [];
    }

    // Normalize roles to lowercase
    window.elvantoUserRoles = (window.elvantoUserRoles || []).map(normalizeRoleName);
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Normalized user roles:", window.elvantoUserRoles);
    }

    const username = personName;
    const nameParts = username.split(' ');
    const firstName = nameParts[0].toLowerCase();
    const lastName = nameParts[nameParts.length - 1].toLowerCase();
    const fullMention = `${firstName}${lastName}`;

    // Get user's roles and transform them for mentions
    const userRoles = window.elvantoUserRoles;
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("User roles for mentions:", userRoles);
    }
    const roleMentionNames = userRoles;

    // Combine all mention targets: personal, all/everyone, and roles
    const mentionTargets = [];
    if (canUseFeature("Command", "@Everyone", userRoles)) {
      mentionTargets.push('everyone');
    }
    if (canUseFeature("Command", "@All", userRoles)) {
      mentionTargets.push('all');
    }
    if (canUseFeature("Command", "@PersonName", userRoles)) {
      mentionTargets.push(firstName, lastName, fullMention);
    }
    if (canUseFeature("Command", "@RoleName", userRoles)) {
      mentionTargets.push(...roleMentionNames);
    }
    const mentionRegex = mentionTargets.length > 0 ? new RegExp(`\\B@(${mentionTargets.join('|')})\\b`, 'i') : null;
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Mention regex pattern:", mentionRegex);
    }

    // Inject Refresh buttons
    injectRefreshButton(
      document.querySelector('.controls-wrapper .live-control'),
      'first live-control'
    );
    injectRefreshButton(
      document.querySelector('.overview.content .live-control'),
      'overview live-control'
    );

    // Inject Last Refresh timestamp
    if (window.isFeatureEnabled && window.isFeatureEnabled("LastRefresh")) {
      const liveControlDivs = [
        document.querySelector('.controls-wrapper .live-control'),
        document.querySelector('.overview.content .live-control')
      ].filter(div => div !== null);

      liveControlDivs.forEach(liveControlDiv => {
        if (!liveControlDiv) {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Live control div not found for LastRefresh injection");
          }
          return;
        }
        if (!liveControlDiv.querySelector('.last-refresh')) {
          const lastRefreshDiv = createLastRefreshElement();
          if (lastRefreshDiv) {
            liveControlDiv.appendChild(lastRefreshDiv);
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`LastRefresh timestamp injected into ${liveControlDiv.className}`);
            }
          } else {
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("Failed to create LastRefresh element");
            }
          }
        } else {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`LastRefresh timestamp already exists in ${liveControlDiv.className}`);
          }
        }
      });
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("LastRefresh feature disabled by kill switch");
      }
    }

    // Correct description styles
    const descriptionDivs = document.querySelectorAll('.plan.content .description-description div[style]');
    correctDescriptionStyles(descriptionDivs);

    // Track hide slash commands toggle state
    let hideSlashCommands = false;

    // Function to hide or show slash command messages
    const toggleSlashCommandVisibility = (messages, shouldHide) => {
      messages.forEach(message => {
        const messageText = message.textContent.trim();
        const liElement = message.closest('li');
        if (liElement) {
          if (shouldHide && messageText.startsWith('/')) {
            liElement.style.display = 'none';
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`Hid slash command message: ${messageText}`);
            }
          } else if (!shouldHide && messageText.startsWith('/')) {
            liElement.style.display = '';
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`Showed slash command message: ${messageText}`);
            }
          }
        }
      });
    };

    // Function to check mentions in initial messages
    const checkMessagesForMentions = (messages) => {
      messages.forEach(message => {
        const messageText = message.textContent.trim();
        const liElement = message.closest('li');
        if (hideSlashCommands && messageText.startsWith('/')) {
          if (liElement) {
            liElement.style.display = 'none';
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`Hid slash command message: ${messageText}`);
            }
          }
        } else if (mentionRegex && mentionRegex.test(messageText)) {
          message.classList.add('mentioned');
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Highlighted mention: ${messageText}`);
          }
          // Show OS notification
          const senderName = liElement?.querySelector('.name')?.textContent.split(' - ')[0]?.trim() || 'Unknown';
          showNotification(`Mention in Elvanto Live`, {
            body: `${senderName}: ${messageText}`,
            icon: 'https://www.elvanto.com.au/wp-content/themes/elvanto/assets/images/logo.png'
          });
        }
      });
    };

    // Function to check commands and mentions in new messages
    const checkMessagesForCommands = (messages) => {
      try {
        messages.forEach(message => {
          const messageText = message.textContent.trim();
          const liElement = message.closest('li');
          if (liElement) {
            const senderNameRaw = liElement.querySelector('.name')?.textContent.split(' - ')[0]?.trim();
            if (!senderNameRaw) {
              if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                console.log("Sender name not found in message");
              }
              return;
            }
            const senderName = senderNameRaw.replace(/\s+/g, ' ').trim();
            const senderFirstName = senderName.split(' ')[0];
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`Message: ${messageText}, Sender: ${senderName}, Current user: ${personName}`);
            }

            if (hideSlashCommands && messageText.startsWith('/')) {
              liElement.style.display = 'none';
              if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                console.log(`Hid slash command message: ${messageText}`);
              }
            }

            if (canUseFeature("Command", "/refresh", window.elvantoUserRoles) && messageText.toLowerCase() === "/refresh") {
              const normalizedSender = senderName.replace(/,\s*/g, ' ').trim();
              const normalizedPerson = personName.replace(/,\s*/g, ' ').trim();
              if (normalizedSender === normalizedPerson) {
                if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                  console.log("Refresh command from current user, reloading...");
                }
                location.reload();
              } else {
                const controllerFirstName = getControllerName();
                if (controllerFirstName && senderFirstName === controllerFirstName) {
                  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                    console.log("Refresh command from controller, reloading...");
                  }
                  location.reload();
                } else {
                  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                    console.log("Ignoring /refresh: sender not current user or controller");
                  }
                }
              }
            } else if (mentionRegex && mentionRegex.test(messageText)) {
              message.classList.add('mentioned');
              if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                console.log(`Highlighted mention: ${messageText}`);
              }
              // Show OS notification
              const senderName = liElement?.querySelector('.name')?.textContent.split(' - ')[0]?.trim() || 'Unknown';
              showNotification(`Mention in Elvanto Live`, {
                body: `${senderName}: ${messageText}`,
                icon: 'https://www.elvanto.com.au/wp-content/themes/elvanto/assets/images/logo.png'
              });
            }
          }
        });
      } catch (error) {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.error("Error in checkMessagesForCommands:", error);
        }
      }
    };

    // Highlight existing messages and check for mentions
    const chatContainer = document.querySelector('.chat .content ol');
    if (chatContainer) {
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
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Chat observer started");
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error("Chat container not found");
      }
    }

    // Inject toggles into dropdown menu
    const dropdownMenu = document.querySelector('ul.dropdown-menu.dropdown-menu-right');
    if (dropdownMenu) {
      // Notification toggle
      if ('Notification' in window && canUseFeature("SettingToggle", "Notification", window.elvantoUserRoles)) {
        const notificationItem = document.createElement('li');
        notificationItem.innerHTML = `
          <label class="custom-checkbox-label" data-live-action="toggle-notifications">
            <div class="custom-checkbox${Notification.permission === 'granted' ? ' checked' : ''}">
              <i class="fa fa-check"></i>
            </div>
            Notifications
          </label>
        `;
        dropdownMenu.appendChild(notificationItem);

        const notificationLabel = notificationItem.querySelector('label');
        const checkboxDiv = notificationItem.querySelector('.custom-checkbox');

        // Initialize notificationsEnabled based on checkbox state
        notificationsEnabled = Notification.permission === 'granted' && checkboxDiv.classList.contains('checked');
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log(`Initial notificationsEnabled: ${notificationsEnabled}`);
        }

        notificationLabel.addEventListener('click', (event) => {
          event.preventDefault(); // Prevent default dropdown behavior
          const isChecked = checkboxDiv.classList.contains('checked');

          if (!isChecked) {
            // Request permission when enabling
            requestNotificationPermission().then(granted => {
              if (granted) {
                checkboxDiv.classList.add('checked');
                notificationsEnabled = true;
                if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                  console.log("Notifications enabled by user");
                }
              } else {
                checkboxDiv.classList.remove('checked');
                notificationsEnabled = false;
                if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                  console.log("User denied notification permission");
                }
                alert("Notifications were not enabled. You can enable them in your browser settings.");
              }
            });
          } else {
            // Disable notifications
            checkboxDiv.classList.remove('checked');
            notificationsEnabled = false;
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("Notifications disabled by user");
            }
            alert("Notifications disabled. You can re-enable them here or in your browser settings.");
          }
        });
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("Notifications API not supported or disabled by kill switch/permissions");
        }
      }

      // Hide slash commands toggle
      if (canUseFeature("SettingToggle", "HideCommands", window.elvantoUserRoles)) {
        const hideSlashItem = document.createElement('li');
        hideSlashItem.innerHTML = `
          <label class="custom-checkbox-label" data-live-action="toggle-hide-slash-commands">
            <div class="custom-checkbox">
              <i class="fa fa-check"></i>
            </div>
            Hide Commands In Chat
          </label>
        `;
        dropdownMenu.appendChild(hideSlashItem);

        const hideSlashLabel = hideSlashItem.querySelector('label');
        const hideSlashCheckboxDiv = hideSlashItem.querySelector('.custom-checkbox');

        hideSlashLabel.addEventListener('click', (event) => {
          event.preventDefault(); // Prevent default dropdown behavior
          const isChecked = hideSlashCheckboxDiv.classList.contains('checked');

          if (!isChecked) {
            hideSlashCheckboxDiv.classList.add('checked');
            hideSlashCommands = true;
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("Hide slash commands enabled");
            }
            // Hide slash commands without triggering notifications
            const allMessages = document.querySelectorAll('.chat .content ol div.text');
            toggleSlashCommandVisibility(allMessages, true);
          } else {
            hideSlashCheckboxDiv.classList.remove('checked');
            hideSlashCommands = false;
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("Hide slash commands disabled");
            }
            // Show all previously hidden slash commands
            const allMessages = document.querySelectorAll('.chat .content ol div.text');
            toggleSlashCommandVisibility(allMessages, false);
          }
        });
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("HideCommands toggle disabled by kill switch/permissions");
        }
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error("Dropdown menu not found for toggles");
      }
    }
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error in initExtension:", error);
    }
  }
}

// Start initialization
const startExtension = async (retries = 10) => {
  try {
    // Initialize roles to avoid undefined
    window.elvantoUserRoles = window.elvantoUserRoles || [];

    if (
      window.elvantoRolesReady &&
      isDomReady() &&
      typeof window.isFeatureEnabled !== 'undefined' &&
      typeof window.killSwitchesLoaded !== 'undefined' &&
      typeof window.hasPermission !== 'undefined' &&
      typeof window.permissionsLoaded !== 'undefined'
    ) {
      try {
        await Promise.all([window.killSwitchesLoaded, window.permissionsLoaded]);
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("Roles, DOM, kill switches, and permissions ready, initializing extension:", window.elvantoUserRoles);
        }
        initExtension();
      } catch (error) {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.error("Error loading kill switches or permissions, initializing with defaults:", error.message);
        }
        initExtension();
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(
          `Waiting for rolesReady=${window.elvantoRolesReady}, ` +
          `DOM=${isDomReady()}, ` +
          `isFeatureEnabled=${typeof window.isFeatureEnabled}, ` +
          `killSwitchesLoaded=${typeof window.killSwitchesLoaded}, ` +
          `hasPermission=${typeof window.hasPermission}, ` +
          `permissionsLoaded=${typeof window.permissionsLoaded}, ` +
          `${retries} retries left...`
        );
      }
      if (retries > 0) {
        setTimeout(() => startExtension(retries - 1), 1000);
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.error("Roles, DOM, kill switches, or permissions not ready after retries, initializing with defaults");
        }
        initExtension();
      }
    }
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error in startExtension:", error);
    }
  }
};

startExtension();