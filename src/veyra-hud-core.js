// ==UserScript==
// @name         Veyra Hud Core
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Core functionality for veyra-hud
// @author       [SEREPH] koenrad
// @updateURL    https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/veyra-hud-core.js
// @downloadURL  https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/veyra-hud-core.js
// @match        https://demonicscans.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=demonicscans.org
// @grant        GM_addStyle
// ==/UserScript==

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(name + "="))
    ?.split("=")[1];
}

async function internalFetch(url) {
  const response = await fetch(url);
  const html = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  return doc;
}

function getUserId() {
  const img = document.querySelector('.small-ava img[src*="user_"]');
  if (!img) return null;

  const match = img.src.match(/user_(\d+)_/);
  return match ? Number(match[1]) : null;
}

function showNotification(msg, type = "success") {
  const note = document.getElementById("notification");
  if (!note) return;
  note.innerHTML = msg;
  note.style.background = type === "error" ? "#e74c3c" : "#2ecc71";
  note.style.display = "block";
  setTimeout(() => {
    note.style.display = "none";
  }, 3000);
}

const Storage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  has(key) {
    return localStorage.getItem(key) !== null;
  },
};

// Pass in Battle page
function getMonsterNameFromBattlePage(doc = document) {
  const cardTitle = doc.querySelector(".monster-card .card-title");
  if (!cardTitle) return null;

  // Find the first text node (safer than childNodes[0])
  const textNode = [...cardTitle.childNodes].find(
    (node) => node.nodeType === Node.TEXT_NODE
  );
  if (!textNode) return null;

  return textNode.textContent
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .trim();
}

// ------------------------ Settings Drawer --------------------------- //

GM_addStyle(`.switch-label {
    position: relative;
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    user-select: none;
  }
  .switch-label input[type="checkbox"] {
    display: none;
  }
  .switch-label .slider {
    position: relative;
    width: 36px;
    height: 20px;
    background-color: #ccc;
    border-radius: 20px;
    transition: background-color 0.3s;
  }
  .switch-label .slider::before {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    left: 2px;
    top: 2px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
  }
  .switch-label input[type="checkbox"]:checked + .slider {
    background-color: #4caf50;
  }
  .switch-label input[type="checkbox"]:checked + .slider::before {
    transform: translateX(16px);
  }
  .set-tabs {
      flex-wrap: wrap;
      justify-content: center !important;
      overflow-x: visible !important;
  }`);

GM_addStyle(`
  
.settings-drawer-trigger {
  position: fixed;
  right: 175px;
  bottom: 17px;
  z-index: 10001;
  background: #24263a;
  border: 1px solid #2f324d;
  box-shadow: 0 10px 24px rgba(0, 0, 0, .6);
  border-radius: 12px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  line-height: 1.2;
  padding: 10px 12px;
  gap: 6px;
}

#settingsDrawer {
  position: fixed;
  top: 0;
  right: -280px;
  width: 260px;
  max-width: 80vw;
  height: 100vh;
  background: #1a1b25;
  border-left: 1px solid #2f324d;
  box-shadow: 0 0 30px rgba(0, 0, 0, .8);
  z-index: 10002;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: right .25s ease;
  color: #fff;
  font-family: Arial, sans-serif;
}
body.settingsdrawer-open #battleDrawerBackdrop {
  display: block;
}

body.settingsdrawer-open #settingsDrawer {
  right: 0;
}

`);
function initSettingsDrawer() {
  const bodyEl = document.body;

  // 1️⃣ Prevent duplicate drawer
  if (document.getElementById("settingsDrawer")) {
    console.warn("Settings drawer already exists. Skipping injection.");
  } else {
    const original = document.getElementById("qsDrawer");
    if (!original) {
      console.error("Original Quick Sets drawer not found. Cannot clone.");
      return;
    }

    // Clone drawer and update ID
    const drawer = original.cloneNode(true);
    drawer.id = "settingsDrawer";

    // Update header
    const titleEl = drawer.querySelector(".title");
    const subtitleEl = drawer.querySelector(".subtitle");
    if (titleEl) titleEl.textContent = "Veyra-Hud Settings";
    if (subtitleEl)
      subtitleEl.textContent =
        "Global settings for various plugins and userscripts developed by koenrad for the SEREPH guild";

    // Update close button
    const closeBtn = drawer.querySelector(".qs-drawer-close");
    if (closeBtn) closeBtn.id = "closeSettingsDrawerBtn";

    // Replace list with container for future settings buttons
    const listEl = drawer.querySelector(".qs-list");
    if (listEl) {
      listEl.innerHTML = `
        <div id="settingsDrawerContainer" style="display:flex;flex-direction:column;gap:8px;"></div>
      `;
    }

    // Insert drawer next to original
    original.insertAdjacentElement("afterend", drawer);
  }

  // 2️⃣ Prevent duplicate trigger button
  if (!document.getElementById("openSettingsDrawerBtn")) {
    const originalBtn = document.getElementById("openQuickSetDrawerBtn");
    if (!originalBtn) {
      console.error("Original Quick Sets trigger button not found.");
      return;
    }

    const btn = originalBtn.cloneNode(true);
    btn.id = "openSettingsDrawerBtn";

    // Remove old classes and add new
    btn.className = "";
    btn.classList.add("settings-drawer-trigger");

    btn.title = "Dungeon Settings";
    btn.textContent = "⚙️";

    originalBtn.insertAdjacentElement("afterend", btn);
  }

  // 3️⃣ Wire open/close logic
  const openBtn = document.getElementById("openSettingsDrawerBtn");
  const closeBtn = document.getElementById("closeSettingsDrawerBtn");
  const backdrop = document.getElementById("battleDrawerBackdrop");

  if (!openBtn || !closeBtn || !backdrop) return;

  function openDrawer() {
    bodyEl.classList.add("settingsdrawer-open");
  }
  function closeDrawer() {
    bodyEl.classList.remove("settingsdrawer-open");
    window.location.reload();
  }

  openBtn.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });
}

/**
 * Adds a settings group to the Settings Drawer container.
 *
 * @param {string} groupId - Unique ID for the group.
 * @param {string} title - The title of the group.
 * @param {string} subtitle - The subtitle/description of the group.
 * @param {HTMLElement|HTMLElement[]} elements - One or more HTML elements to append under the title/subtitle.
 * @returns {HTMLElement} - The created group element.
 */
function addSettingsGroup(groupId, title, subtitle, elements) {
  const container = document.getElementById("settingsDrawerContainer");
  if (!container) {
    console.error(
      "Settings drawer container not found. Make sure initSettingsDrawer() has run."
    );
    return null;
  }

  if (document.getElementById(groupId)) {
    console.warn(
      `Settings group with id "${groupId}" already exists. Skipping creation.`
    );
    return document.getElementById(groupId);
  }

  // Ensure elements is an array
  if (!Array.isArray(elements)) elements = [elements];

  // Create group wrapper
  const group = document.createElement("div");
  group.className = "settings-group";
  group.id = groupId;
  group.style.display = "flex";
  group.style.flexDirection = "column";
  group.style.gap = "6px";
  group.style.padding = "8px 0";
  group.style.borderBottom = "1px solid rgba(255,255,255,0.1)";

  // Title
  const titleEl = document.createElement("div");
  titleEl.textContent = title;
  titleEl.style.fontWeight = "700";
  titleEl.style.fontSize = "14px";
  group.appendChild(titleEl);

  // Subtitle
  if (subtitle) {
    const subtitleEl = document.createElement("div");
    subtitleEl.textContent = subtitle;
    subtitleEl.style.fontSize = "12px";
    subtitleEl.style.opacity = "0.7";
    group.appendChild(subtitleEl);
  }

  // Append provided elements
  elements.forEach((el) => group.appendChild(el));

  // Append group to container
  container.appendChild(group);

  return group;
}

/**
 * Adds elements to an existing settings group.
 *
 * @param {string} groupId - ID of the existing group.
 * @param {HTMLElement|HTMLElement[]} elements - Element(s) to append to the group.
 */
function addToSettingsGroup(groupId, elements) {
  const group = document.getElementById(groupId);
  if (!group) {
    console.error(`Settings group with id "${groupId}" not found.`);
    return;
  }

  if (!Array.isArray(elements)) elements = [elements];
  elements.forEach((el) => group.appendChild(el));
}

/**
 * Creates a persistent settings input bound to Storage.
 *
 * @param {Object} options
 * @param {string} options.key           Storage key
 * @param {string} options.label         Label text
 * @param {string} [options.type]        Input type (checkbox, number, text, select, etc.)
 * @param {*}      [options.defaultValue] Default value if none stored
 * @param {Object} [options.inputProps]  Extra properties to assign to the input
 * @param {Array}  [options.options]     Options for <select> [{ value, label }]
 * @param {Function} [options.onChange]  Callback when value changes
 *
 * @returns {{ container: HTMLElement, input: HTMLElement }}
 */
function createSettingsInput({
  key,
  label,
  type = "checkbox",
  defaultValue = null,
  inputProps = {},
  options = [],
  onChange = null,
}) {
  if (!key || !label) {
    throw new Error("createSettingsInput requires both key and label");
  }

  // Load stored value
  const storedValue = Storage.get(key, defaultValue);

  // Container
  const container = document.createElement("label");
  container.className = "settings-input";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.gap = "8px";
  container.style.cursor = "pointer";
  container.style.marginTop = "6px";

  // Label text
  const textEl = document.createElement("span");
  textEl.textContent = label;
  textEl.style.marginLeft = "5px";
  textEl.style.marginRight = "5px";

  let input;

  // ----- Create input -----
  if (type === "select") {
    input = document.createElement("select");

    options.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      input.appendChild(opt);
    });

    input.value = storedValue;
  } else {
    input = document.createElement("input");
    input.type = type;
    input.style.marginLeft = "5px";
    input.style.marginRight = "5px";

    if (type === "checkbox") {
      input.checked = Boolean(storedValue);
    } else if (storedValue !== null) {
      input.value = storedValue;
    }
  }

  // Assign extra properties
  Object.assign(input, inputProps);

  // Tag input for discovery
  input.dataset.settingKey = key;

  // ----- Persistence -----
  const getValue = () => {
    if (type === "checkbox") return input.checked;
    if (type === "number") return Number(input.value);
    return input.value;
  };

  input.addEventListener("change", () => {
    const value = getValue();
    Storage.set(key, value);

    if (typeof onChange === "function") {
      onChange(value, input);
    }
  });

  input.id = key;

  // Optional slider styling compatibility
  if (type === "checkbox") {
    container.classList.add("switch-label");
    const slider = document.createElement("span");
    slider.className = "slider";

    const labelText = document.createElement("span");
    labelText.textContent = label;

    container.appendChild(input); // 👈 input first
    container.appendChild(slider); // 👈 slider immediately after
    container.appendChild(labelText); // 👈 text last
  } else {
    // Assemble
    container.appendChild(textEl);
    container.appendChild(input);
  }

  return { container, input };
}

// Run settings initializer
initSettingsDrawer();

// ------------------------ Settings Drawer --------------------------- //
