// ==UserScript==
// @name         Filter Inventory
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  Filters the inventory semi-permanently, centers the sets on mobile
// @author       [SEREPH] koenrad
// @updateURL    https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/filter-inventory.js
// @downloadURL  https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/filter-inventory.js
// @require      https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/veyra-hud-core.js
// @match        https://demonicscans.org/inventory.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=demonicscans.org
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  let filterInventory = Storage.get("filterInventory", true);
  let enableInventoryFilter = Storage.get(
    "inventory-filter:enableInventoryFilter",
    true
  );
  if (addSettingsGroup && createSettingsInput) {
    const { container: enableInventoryFilteringToggle } = createSettingsInput({
      key: "inventory-filter:enableInventoryFilter",
      label: "Enable Inventory Filter",
      defaultValue: true,
      type: "checkbox",
      inputProps: { slider: true },
    });

    addSettingsGroup(
      "inventory",
      "Inventory Settings",
      "Settings related to the inventory",
      [enableInventoryFilteringToggle]
    );
  } else {
    alert("There was an error loading veyra-hud-core.js");
  }

  function addInventoryToggle() {
    const container = document.querySelector(".set-tabs");
    if (container) {
      // --------- Inventory Toggle Injection ---------//
      const toggleContainer = document.createElement("label");
      toggleContainer.className = "tab switch-label";
      toggleContainer.style.display = "flex";
      toggleContainer.style.alignItems = "center";
      toggleContainer.style.gap = "8px";
      toggleContainer.style.cursor = "pointer";

      const toggleText = document.createElement("span");
      toggleText.textContent = "Filter Inventory";

      const toggleInput = document.createElement("input");
      toggleInput.type = "checkbox";
      toggleInput.id = "filter-inventory-toggle";
      toggleInput.checked = filterInventory;

      const slider = document.createElement("span");
      slider.className = "slider";

      toggleContainer.appendChild(toggleText);
      toggleContainer.appendChild(toggleInput);
      toggleContainer.appendChild(slider);
      container.appendChild(toggleContainer);

      // Handle toggle logic
      toggleInput.addEventListener("change", (e) => {
        filterInventory = e.target.checked;
        const settings = document.getElementById("filter-settings-wrapper");
        settings.style.display = filterInventory ? "block" : "none";
        Storage.set("filterInventory", filterInventory);
        console.log(
          "Filter-Inventory:",
          filterInventory ? "enabled" : "disabled"
        );
        filterInventoryItems();
      });
      // --------- Inventory Toggle Injection End -----//
    }
  }

  function addInventoryFilterUI(itemNames) {
    const hostContainer = document.querySelector(".set-tabs");
    const wrapper = document.createElement("div");
    wrapper.id = "filter-settings-wrapper";
    wrapper.style.position = "relative";
    wrapper.style.display = filterInventory ? "block" : "none";

    wrapper.innerHTML = `
          <button id="filter-settings-btn" class="tab" style="height:100%">⚙ Filters</button>

          <div id="filter-settings-panel"
              style="
                display:none;
                position:absolute;
                right:0;
                top:36px;
                background:#222;
                padding:10px;
                border:1px solid #444;
                border-radius:5px;
                min-height:300px;
                max-height: 600px;
                overflow-y:auto;
                width:300px;
                z-index:99999999;
              ">
            <strong>Show these items:</strong><br><br>
            <div id="filter-checkboxes"></div>
          </div>
        `;

    // document.body.appendChild(container);
    hostContainer.appendChild(wrapper);

    // Panel toggle
    document.getElementById("filter-settings-btn").onclick = () => {
      const panel = document.getElementById("filter-settings-panel");
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    // Close panel when clicking outside
    document.addEventListener("click", function (e) {
      const panel = document.getElementById("filter-settings-panel");
      const btn = document.getElementById("filter-settings-btn");

      if (!panel || panel.style.display === "none") return;

      if (!panel.contains(e.target) && !btn.contains(e.target)) {
        panel.style.display = "none";
      }
    });

    // Fill checkboxes
    const boxContainer = document.getElementById("filter-checkboxes");
    let saved = Storage.get("inventoryFilters", {});

    itemNames.forEach((name) => {
      const checked = saved[name] !== false;
      const id = "filter_" + name.replace(/\W+/g, "_");

      boxContainer.innerHTML += `
      <label style="display:block;margin-bottom:5px;">
        <input type="checkbox" class="filter-checkbox" data-name="${name}" ${
        checked ? "checked" : ""
      }>
        ${name}
      </label>
    `;
    });

    // Save on change
    boxContainer.querySelectorAll(".filter-checkbox").forEach((cb) => {
      cb.addEventListener("change", () => {
        let store = {};
        boxContainer.querySelectorAll(".filter-checkbox").forEach((x) => {
          store[x.dataset.name] = x.checked;
        });

        Storage.set("inventoryFilters", store);
        filterInventoryItems();
      });
    });
  }

  function extractItemNames() {
    const names = new Set();

    document.querySelectorAll(".slot-box .info-btn").forEach((btn) => {
      const name = (btn.dataset.name || "").trim();
      if (name.length > 0) names.add(name);
    });

    return [...names];
  }

  function filterInventoryItems() {
    const saved = Storage.get("inventoryFilters", {});

    document.querySelectorAll(".slot-box").forEach((slot) => {
      const infoBtn = slot.querySelector(".info-btn");
      if (!infoBtn) return;

      const name = infoBtn.dataset.name.trim();
      const keep = filterInventory ? saved[name] !== false : true;

      slot.style.display = keep ? "" : "none";
    });
  }

  if (enableInventoryFilter) {
    addInventoryToggle();
    const items = extractItemNames();
    addInventoryFilterUI(items);
    if (filterInventory) {
      filterInventoryItems();
    }
  }
})();
