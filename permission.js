console.log("Elvanto Permissions Service Loaded");

window.permissions = window.permissions || {};
window.permissions.Roles = window.permissions.Roles || {};

// Function to normalize role names
function normalizeRoleName(role) {
  return role ? role.toLowerCase().replace(/\s+/g, '') : '';
}

// Function to fetch and parse permissions
function fetchPermissions(churchName) {
  console.log(`Fetching permissions from: https://nathan31973.github.io/Elvanto-Plus-Plus-Assets/Permission/${churchName}-config.xml`);

  return fetch(`https://nathan31973.github.io/Elvanto-Plus-Plus-Assets/Permission/${churchName}-config.xml`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(xmlText => {
      console.log("Raw XML truncated for logging:", xmlText.substring(0, 500) + (xmlText.length > 500 ? "..." : ""));
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      const roles = xmlDoc.getElementsByTagName("Role");
      console.log(`Found ${roles.length} Role nodes`);

      window.permissions.Roles = {}; // Reset roles

      for (let role of roles) {
        let roleNameNode = role.getElementsByTagName("RoleName")[0] || role.getElementsByTagName("Name")[0];
        if (!roleNameNode) {
          console.warn("Role missing RoleName or Name, skipping");
          continue;
        }
        const rawRoleName = roleNameNode.textContent.trim();
        const roleName = normalizeRoleName(rawRoleName);
        if (!roleName) {
          console.warn("Invalid role name, skipping");
          continue;
        }

        const priorityNode = role.getElementsByTagName("Priority")[0];
        const priority = priorityNode ? parseInt(priorityNode.textContent.trim(), 10) || 99 : 99;
        const roleColourNode = role.getElementsByTagName("RoleColour")[0];
        const roleColour = roleColourNode ? roleColourNode.textContent.trim() : null;

        // Log RoleColour for debugging
        if (roleColour) {
          console.log(`Loaded color ${roleColour} for role ${roleName}`);
        } else {
          console.warn(`No RoleColour defined for role ${roleName}`);
        }

        window.permissions.Roles[roleName] = {
          Priority: priority,
          RoleColour: roleColour,
          Commands: {},
          Buttons: {},
          SettingToggles: {}
        };

        // Parse Commands
        const commands = role.getElementsByTagName("Command");
        console.log(`Found ${commands.length} Command nodes for role ${roleName}`);
        for (let command of commands) {
          const commandName = command.getAttribute("CommandName") || command.getAttribute("Name");
          const availability = command.getAttribute("Availability") || command.getAttribute("Access");
          if (commandName) {
            window.permissions.Roles[roleName].Commands[commandName] = availability === "true";
          }
        }

        // Parse Buttons
        const buttons = role.getElementsByTagName("Button");
        console.log(`Found ${buttons.length} Button nodes for role ${roleName}`);
        for (let button of buttons) {
          const buttonName = button.getAttribute("ButtonName") || button.getAttribute("Name");
          const availability = button.getAttribute("Availability") || button.getAttribute("Access");
          if (buttonName) {
            window.permissions.Roles[roleName].Buttons[buttonName] = availability === "true";
          }
        }

        // Parse SettingToggles
        const settingToggles = role.getElementsByTagName("SettingToggle");
        console.log(`Found ${settingToggles.length} SettingToggle nodes for role ${roleName}`);
        for (let toggle of settingToggles) {
          const toggleName = toggle.getAttribute("ToggleName") || toggle.getAttribute("Name");
          const availability = toggle.getAttribute("Availability") || toggle.getAttribute("Access");
          if (toggleName) {
            window.permissions.Roles[roleName].SettingToggles[toggleName] = availability === "true";
          }
        }
      }

      console.log("Parsed permissions:", JSON.stringify(window.permissions, null, 2));
      return window.permissions;
    })
    .catch(error => {
      console.error("Error fetching or parsing permissions:", error);
      return null;
    });
}

// Function to check if a role has permission for a feature
window.hasPermission = function(role, featureType, featureName) {
  if (!window.permissions || !window.permissions.Roles || !window.permissions.Roles[role]) {
    console.warn(`Permission check failed: role ${role} not found`);
    return false;
  }

  const roleData = window.permissions.Roles[role];
  let hasAccess = false;

  if (featureType === "Command") {
    hasAccess = roleData.Commands[featureName] === true;
  } else if (featureType === "Button") {
    hasAccess = roleData.Buttons[featureName] === true;
  } else if (featureType === "SettingToggle") {
    hasAccess = roleData.SettingToggles[featureName] === true;
  }

  console.log(`Checking permission for ${role}, ${featureType}:${featureName} -> ${hasAccess}`);
  return hasAccess;
};

// Initialize permissions
window.permissionsLoaded = (function() {
  const url = window.location.href;
  const churchNameMatch = url.match(/https:\/\/([^.]+)\.elvanto\.com\.au\//);
  const churchName = churchNameMatch ? churchNameMatch[1] : null;

  if (!churchName) {
    console.error("Could not extract church name from URL:", url);
    return Promise.resolve(null);
  }

  console.log("Extracted church name:", churchName);
  return fetchPermissions(churchName);
})();

window.permissionsLoaded.then(() => {
  console.log("Permissions initialization complete");
}).catch(err => {
  console.error("Permissions initialization failed:", err);
});