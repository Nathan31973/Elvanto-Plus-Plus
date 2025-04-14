console.log("Elvanto Role Cacher By Nathan3197");
console.log("Current URL:", window.location.href);

// Function to get the current user's name and all roles from <li class="current">
function getUserInfoFromRoster() {
  const currentItems = document.querySelectorAll('.service-volunteers .positions li.current');
  let name = null;
  const roles = [];

  for (let item of currentItems) {
    const nameElement = item.querySelector('.person .name');
    const positionElement = item.querySelector('.position');
    if (nameElement && positionElement) {
      const currentName = nameElement.textContent.trim();
      const role = positionElement.textContent.trim();
      if (!name) name = currentName; // Set name from first match
      if (currentName === name && role) {
        roles.push(role);
      }
    }
  }

  if (name && roles.length > 0) {
    console.log(`Found user: ${name}, roles: ${roles.join(', ')}`);
    return { name, roles };
  }
  console.log(name ? `No roles found for ${name} in current items` : "No current roster items found");
  return name ? { name, roles: [] } : null;
}

// Function to get the service ID from the URL or href
function getServiceIdFromUrlOrHref(urlOrHref) {
  const match = urlOrHref.match(/#service-([a-f0-9-]+)/);
  if (match) {
    console.log("Found service ID:", match[1]);
    return match[1];
  }
  const urlParams = new URLSearchParams(new URL(urlOrHref, window.location.origin).search);
  const timeId = urlParams.get('time_id');
  if (timeId) {
    console.log("Found service ID from time_id:", timeId);
    return timeId;
  }
  console.log("No service ID found in", urlOrHref);
  return null;
}

// Function to cache the roles in localStorage
function cacheRoles(serviceId, roles) {
  if (!serviceId) {
    console.log("Cannot cache: missing serviceId");
    return;
  }
  let roleCache = JSON.parse(localStorage.getItem('elvantoRoles') || '{}');
  roleCache[serviceId] = roles || []; // Ensure array
  localStorage.setItem('elvantoRoles', JSON.stringify(roleCache));
  console.log(`Cached roles [${roles.join(', ') || 'none'}] for service ${serviceId}`);
}

// Function to retrieve the cached roles
function getCachedRoles(serviceId) {
  if (!serviceId) return [];
  const roleCache = JSON.parse(localStorage.getItem('elvantoRoles') || '{}');
  let roles = roleCache[serviceId];
  // Handle legacy formats: string, undefined, or null
  if (typeof roles === 'string') {
    roles = [roles]; // Convert single role to array
  } else if (!Array.isArray(roles)) {
    roles = []; // Convert undefined/null to empty array
  }
  console.log(`Retrieved roles [${roles.join(', ') || 'none'}] for service ${serviceId}`);
  return roles;
}

// Function to handle service button click with retry
function handleServiceButtonClick(serviceId, retries = 3, delay = 500) {
  const attempt = () => {
    const userInfo = getUserInfoFromRoster();
    if (userInfo) {
      const { name, roles } = userInfo;
      console.log(`Service button for ${serviceId} clicked, caching roles for ${name}`);
      cacheRoles(serviceId, roles);
    } else if (retries > 0) {
      console.log(`No user info for service ${serviceId}, retrying (${retries} left)...`);
      setTimeout(() => handleServiceButtonClick(serviceId, retries - 1, delay), delay);
    } else {
      console.log(`No user info for service ${serviceId} after retries, caching empty roles`);
      cacheRoles(serviceId, []);
    }
  };
  attempt();
}

// Function to initialize the script
function initRoleCacher() {
  const url = window.location.href;

  // Roster page: cache roles on Live button or service button click
  if (url.match(/^https:\/\/.*\.elvanto\.com\.au\/roster\//)) {
    // Handle Live button
    const liveButton = document.querySelector('a[href*="/live/"], button[data-live], .btn-live, [data-action="live"]');
    if (liveButton) {
      liveButton.addEventListener('click', (e) => {
        const serviceId = getServiceIdFromUrlOrHref(window.location.href);
        if (serviceId) {
          const userInfo = getUserInfoFromRoster();
          if (userInfo) {
            const { name, roles } = userInfo;
            console.log(`Live button clicked for ${name}, caching roles...`);
            cacheRoles(serviceId, roles);
          } else {
            console.log("No user info for Live button, caching empty roles");
            cacheRoles(serviceId, []);
          }
        }
      });
      console.log("Live button listener added");
    } else {
      console.log("Live button not found, checking again...");
      setTimeout(() => {
        const retryButton = document.querySelector('a[href*="/live/"], button[data-live], .btn-live, [data-action="live"]');
        if (retryButton) {
          retryButton.addEventListener('click', (e) => {
            const serviceId = getServiceIdFromUrlOrHref(window.location.href);
            if (serviceId) {
              const userInfo = getUserInfoFromRoster();
              if (userInfo) {
                const { name, roles } = userInfo;
                console.log(`Live button clicked (retry) for ${name}, caching roles...`);
                cacheRoles(serviceId, roles);
              } else {
                console.log("No user info for Live button (retry), caching empty roles");
                cacheRoles(serviceId, []);
              }
            }
          });
          console.log("Live button listener added (retry)");
        } else {
          console.log("Live button still not found");
        }
      }, 1000);
    }

    // Handle service buttons
    const serviceButtons = document.querySelectorAll('a.my-schedule[href*="#service-"]');
    serviceButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const serviceId = getServiceIdFromUrlOrHref(button.href);
        if (serviceId) {
          console.log(`Service button clicked for service ${serviceId}, fetching roles...`);
          handleServiceButtonClick(serviceId);
        }
      });
    });
    console.log(`Added listeners to ${serviceButtons.length} service buttons`);
  }

  // Live chat page: retrieve cached roles
  if (url.match(/^https:\/\/.*\.elvanto\.com\.au\/live\//)) {
    const serviceId = getServiceIdFromUrlOrHref(window.location.href);
    if (serviceId) {
      const roles = getCachedRoles(serviceId);
      console.log(`Roles for live chat: ${roles.join(', ') || 'none'}`);
      // Expose roles to page
      window.elvantoUserRoles = roles;
    } else {
      console.log("No service ID, setting empty roles");
      window.elvantoUserRoles = [];
    }
  }
}
initRoleCacher();