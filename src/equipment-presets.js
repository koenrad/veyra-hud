// ==UserScript==
// @name         Equipment Presets
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Adds presets for pets & gear, with dropdown in top bar. Also makes top bar wrap on mobile. - deprecated as functionality is now in vanilla
// @author       koenrad
// @match        https://demonicscans.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=demonicscans.org
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";
  GM_addStyle(`
  .mode-dropdown {
    padding: 4px 8px;
    font-size: 14px;
    border-radius: 4px;
  }

  /* Default (light) mode styles */
  select {
    background-color: #ffffff;
    color: #333333;
    border: 1px solid #ccc;
  }

  /* Dark mode styles */
  @media (prefers-color-scheme: dark) {
    select {
      background-color: #333333;
      color: #ffffff;
      border: 1px solid #666666;
    }
  }
  .set-tabs {
    flex-wrap: wrap;
  }
  .game-topbar {
    position: relative !important;
  }
  body {
    padding-block: 0px !important;
    padding-inline: 0px !important;
    padding-top: 0px !important;
  }
  @media (max-width: 600px) {
    body {
        padding-top: 0px !important;
    }
}
  `);

  function notify(msg, type = "success") {
    const note = document.getElementById("notification");
    if (!note) return;
    note.innerHTML = msg;
    note.style.background = type === "error" ? "#e74c3c" : "#2ecc71";
    note.style.display = "block";
    setTimeout(() => {
      note.style.display = "none";
    }, 3000);
  }

  async function equipItem(invId, slotId) {
    return fetch("inventory_ajax.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `action=equip_item&inv_id=${invId}&slot_id=${slotId}&set=attack`,
    })
      .then((r) => r.text())
      .then((res) => {
        if (res.trim() === "OK") {
          // location.reload(); // keeps ?set=... in URL
          return "OK";
        } else {
          alert(res);
        }
      });
  }

  function equipPet(invId, slotId) {
    return fetch("inventory_ajax.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `action=equip_pet&team=atk&pet_inv_id=${invId}&slot_id=${slotId}`,
    })
      .then((r) => r.text())
      .then((res) => {
        if (res.trim() === "OK") {
          // location.reload();
          return "OK";
        } else alert(res);
      });
  }

  function savePreset(preset) {
    const presets = JSON.parse(localStorage.getItem("gearPetPresets") || "[]");

    // Replace if preset already exists
    const index = presets.findIndex((p) => p.name === preset.name);
    if (index > -1) presets[index] = preset;
    else presets.push(preset);

    localStorage.setItem("gearPetPresets", JSON.stringify(presets));
    addPresetToDropdown(preset); // Add to UI immediately
  }

  function loadPresets() {
    return JSON.parse(localStorage.getItem("gearPetPresets") || "[]");
  }

  function loadGear() {
    return JSON.parse(localStorage.getItem("gear") || "[]");
  }

  function loadPets() {
    return JSON.parse(localStorage.getItem("pets") || "[]");
  }

  function addPresetToDropdown(preset) {
    const dropdown = document.querySelector(".mode-dropdown");
    if (!dropdown) return;

    // Prevent duplicates
    if ([...dropdown.options].some((o) => o.value === preset.name)) return;

    const option = document.createElement("option");
    option.textContent = preset.name;
    option.value = preset.name;
    dropdown.appendChild(option);
  }

  async function equipPreset(presetName) {
    const presets = loadPresets();
    const preset = presets.find((p) => p.name === presetName);
    if (!preset) {
      notify("No preset with that name....", "error");
      return;
    }

    try {
      const results = await Promise.all([
        ...preset.items.map((item) => equipItem(item.invId, 0)),
        ...preset.pets.map((pet, i) => equipPet(pet.invId, i + 1)),
      ]);
      console.log("results", results);

      // Ensure ALL returned "OK"
      const allOK = results.every((r) => {
        console.log("r", r);
        return r.includes("OK");
      });

      if (allOK) {
        notify(`Completed swap to ${presetName}`);
      } else {
        notify(
          `Swap to ${presetName} failed: some or all of the gear was not switched.`,
          "error"
        );
      }
    } catch (err) {
      notify(`Failed to full swap to ${presetName}`, "error");
    }
  }

  function addEquipmentDropdown() {
    const gtbleft = document.querySelector(".gtb-left");
    if (gtbleft) {
      // wrap the top bar, even on small screens.
      gtbleft.style.setProperty("flex-wrap", "wrap", "important");
      // Create dropdown
      const select = document.createElement("select");
      select.className = "mode-dropdown";

      // Default option
      const defaultOption = document.createElement("option");
      defaultOption.textContent = "Swap Equipment";
      defaultOption.value = "";
      defaultOption.disabled = true;
      defaultOption.selected = true;

      // Append default options
      select.append(defaultOption);
      const presets = loadPresets();
      if (presets.length <= 0) {
        console.warn("no presets available");
        return;
      }

      // Insert into container
      gtbleft.appendChild(select);

      presets.forEach((preset) => {
        addPresetToDropdown(preset);
      });

      document
        .querySelector(".mode-dropdown")
        .addEventListener("change", (e) => {
          const presetName = e.target.value;
          if (!presetName) return;
          equipPreset(presetName);
          e.target.value = ""; // reset dropdown
        });
    }
  }

  function getAllInventoryItems() {
    const items = [];

    document.querySelectorAll(".slot-box").forEach((box) => {
      const infoBtn = box.querySelector(".info-btn");
      const equipBtn = box.querySelector(".btn[onclick]");
      if (!infoBtn || !equipBtn) return;

      // 1️⃣ Get the name from data-name
      const name = infoBtn.dataset.name;

      // 2️⃣ Get type and id from onclick
      const onclickStr = equipBtn.getAttribute("onclick");

      const match = onclickStr.match(/\(([\s\S]*)\)/); // [\s\S] matches everything including newlines
      if (!match) return;

      const params = match[1]
        .split(",")
        .map((p) => p.trim().replace(/^['"]|['"]$/g, "")); // trim & remove quotes
      const type = params[1].toLowerCase(); // e.g. "amulet"
      const id = params[2]; // e.g. "14208322"

      items.push({ name, id, type });
    });

    localStorage.setItem("gear", JSON.stringify(items));
    console.info("items:", items);
    return items;
  }

  function getAllPets() {
    const pets = [];

    document.querySelectorAll(".slot-box").forEach((box) => {
      const infoBtn = box.querySelector(".info-btn");
      const equipBtn = box.querySelector(".btn[onclick*='showEquipModal']");

      // Check that it’s a pet slot
      if (!infoBtn || !equipBtn) return;
      const onclickStr = equipBtn.getAttribute("onclick");
      if (!onclickStr.includes("pet")) return;

      // Extract ID from onclick
      const match = onclickStr.match(/\(([\s\S]*)\)/); // match content inside parentheses
      if (!match) return;

      const id = match[1]
        .split(",")[0]
        .trim()
        .replace(/^['"]|['"]$/g, ""); // first param is ID
      const name = infoBtn.dataset.name;

      pets.push({ name, id });
    });

    localStorage.setItem("pets", JSON.stringify(pets));
    console.info("pets:", pets);
    return pets;
  }

  function createPresetPopupUI() {
    // Avoid duplicate popup
    if (document.querySelector("#preset-popup")) return;

    const popup = document.createElement("div");
    popup.id = "preset-popup";
    popup.style = `
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #1e1e1e;
    color: white;
    border: 2px solid #555;
    padding: 20px;
    z-index: 9999;
    max-height: 80%;
    overflow-y: auto;
    width: 400px;
  `;

    popup.innerHTML = `
    <h3>Create Equipment Preset</h3>
    <label>Preset Name: <input type="text" id="preset-name" style="width:80%" /></label>
    <h4>Gear</h4>
    <div id="gear-selects"></div>
    <h4>Pets</h4>
    <div id="pet-selects"></div>
    <div style="margin-top:10px;">
      <button class="btn" id="save-preset-btn">Save Preset</button>
      <button class="btn" id="close-preset-btn">Close</button>
    </div>
  `;

    document.body.appendChild(popup);

    // Close button
    document
      .querySelector("#close-preset-btn")
      .addEventListener("click", () => popup.remove());

    // Populate gear and pets
    populateGearSelects();
    populatePetSelects();

    // Save button
    document.querySelector("#save-preset-btn").addEventListener("click", () => {
      const name = document.querySelector("#preset-name").value.trim();
      if (!name) {
        alert("Enter a preset name.");
        return;
      }

      const gearSelects = document.querySelectorAll("#gear-selects select");
      const petSelects = document.querySelectorAll("#pet-selects select");

      const items = Array.from(gearSelects)
        .map((sel) => ({
          invId: sel.value,
          slotId: parseInt(sel.dataset.slot),
        }))
        .filter((i) => i.invId);

      const pets = Array.from(petSelects)
        .map((sel) => ({
          invId: sel.value,
          slotId: parseInt(sel.dataset.slot),
        }))
        .filter((p) => p.invId);

      const preset = { name, items, pets };
      savePreset(preset); // using your existing function
      alert(`Preset "${name}" saved!`);
      popup.remove();
    });
  }

  function populateGearSelects() {
    const container = document.querySelector("#gear-selects");
    container.innerHTML = "";

    const gearSlots = [
      { label: "Weapon", type: "weapon" },
      { label: "Helmet", type: "helmet" },
      { label: "Armor", type: "armor" },
      { label: "Boots", type: "boots" },
      { label: "Gloves", type: "gloves" },
    ];

    gearSlots.forEach((slot, index) => {
      const div = document.createElement("div");
      div.style = "margin-bottom:6px;";

      const select = document.createElement("select");
      select.dataset.slot = index;
      select.style.width = "100%";

      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "-- None --";
      select.appendChild(emptyOption);

      loadGear()
        .filter((g) => g.type === slot.type)
        .forEach((g) => {
          const opt = document.createElement("option");
          opt.value = g.id;
          opt.textContent = g.name;
          select.appendChild(opt);
        });

      div.textContent = slot.label + ": ";
      div.appendChild(select);
      container.appendChild(div);
    });
  }

  function populatePetSelects() {
    const container = document.querySelector("#pet-selects");
    container.innerHTML = "";

    for (let slot = 1; slot <= 3; slot++) {
      const div = document.createElement("div");
      div.style = "margin-bottom:6px;";

      const select = document.createElement("select");
      select.dataset.slot = slot;
      select.style.width = "100%";

      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "-- None --";
      select.appendChild(emptyOption);

      loadPets().forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
      });

      div.textContent = `Pet Slot ${slot}: `;
      div.appendChild(select);
      container.appendChild(div);
    }
  }

  function addSettingsDropdown() {
    const tabs = document.querySelector(".set-tabs");
    if (tabs) {
      // --------- Dropdown ---------//
      const dropdownContainer = document.createElement("div");
      dropdownContainer.className = "wave-dropdown gtb-stat";
      dropdownContainer.style.position = "relative";
      dropdownContainer.style.background = "#1b1f30";

      // Dropdown button
      const dropdownBtn = document.createElement("button");
      dropdownBtn.textContent = "⚙ Preset Settings ▾";
      dropdownBtn.style.background = "#1b1f30";
      dropdownBtn.style.color = "#ecf0f1";
      dropdownBtn.style.border = "none";
      dropdownBtn.style.padding = "6px 10px";
      dropdownBtn.style.borderRadius = "4px";
      dropdownBtn.style.cursor = "pointer";
      dropdownBtn.style.fontSize = "13px";
      dropdownBtn.style.width = "100%";

      // Dropdown content
      const dropdownContent = document.createElement("div");
      dropdownContent.style.display = "none";
      dropdownContent.style.position = "absolute";
      dropdownContent.style.top = "100%";
      dropdownContent.style.left = "-80px";
      dropdownContent.style.background = "#1e272e";
      dropdownContent.style.border = "1px solid #34495e";
      dropdownContent.style.borderRadius = "4px";
      dropdownContent.style.padding = "8px";
      dropdownContent.style.marginTop = "4px";
      dropdownContent.style.zIndex = "9999";
      dropdownContent.style.minWidth = "125px";
      dropdownContent.style.boxShadow = "0 2px 10px rgba(0,0,0,0.4)";

      // Add toggles
      const btn1 = document.createElement("button");
      btn1.textContent = "Create Preset";
      btn1.style.marginLeft = "10px";
      btn1.className = "btn";
      dropdownContent.appendChild(btn1);
      btn1.addEventListener("click", createPresetPopupUI);

      const btn2 = document.createElement("button");
      btn2.textContent = "Clear All Presets";
      btn2.style.marginLeft = "10px";
      btn2.className = "btn";
      dropdownContent.appendChild(btn2);
      btn2.addEventListener("click", () => {
        localStorage.setItem("gearPetPresets", "[]");
      });

      // Toggle dropdown visibility
      dropdownBtn.addEventListener("click", () => {
        dropdownContent.style.display =
          dropdownContent.style.display === "none" ? "block" : "none";
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!dropdownContainer.contains(e.target)) {
          dropdownContent.style.display = "none";
        }
      });

      dropdownContainer.appendChild(dropdownBtn);
      dropdownContainer.appendChild(dropdownContent);
      tabs.appendChild(dropdownContainer);
    }
  }

  console.info("presets: ", loadPresets());
  addEquipmentDropdown();
  if (window.location.href.includes("/inventory.php")) {
    getAllInventoryItems();
    addSettingsDropdown();
  }
  if (window.location.href.includes("/pets.php")) {
    getAllPets();
  }
})();
