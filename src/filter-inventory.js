// ==UserScript==
// @name         Filter Inventory
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Filters the inventory semi-permanently, centers the sets on mobile
// @author       [SEREPH] koenrad
// @match        https://demonicscans.org/inventory.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=demonicscans.org
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

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

  let filterInventory = localStorage.getItem("filterInventory") === "true"; // persist toggle state

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
        localStorage.setItem("filterInventory", filterInventory);
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
    let saved = JSON.parse(localStorage.getItem("inventoryFilters") || "{}");

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

        localStorage.setItem("inventoryFilters", JSON.stringify(store));
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
    const saved = JSON.parse(localStorage.getItem("inventoryFilters") || "{}");

    document.querySelectorAll(".slot-box").forEach((slot) => {
      const infoBtn = slot.querySelector(".info-btn");
      if (!infoBtn) return;

      const name = infoBtn.dataset.name.trim();
      const keep = filterInventory ? saved[name] !== false : true;

      slot.style.display = keep ? "" : "none";
    });
  }

  addInventoryToggle();
  const items = extractItemNames();
  addInventoryFilterUI(items);
  if (filterInventory) {
    console.log("In PvP Arena");
    filterInventoryItems();
  }
})();
