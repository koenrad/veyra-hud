// ==UserScript==
// @name         Gamba is My Way (enhanced)
// @namespace    https://papa-zeus-777.net
// @version      1.0.1
// @description  Papa Zeus 777 MAX WIN, Dare to TRY????
// @author       Papa ZEUS - enhanced by koenrad
// @updateURL    https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/gamba-enhanced.js
// @downloadURL  https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/gamba-enhanced.js
// @match        https://demonicscans.org/a_lizardmen_winter.php
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const wrapper = document.getElementById("spinForm");
  const actualWrapper = document.getElementById("spinForm").parentElement;

  wrapper.innerHTML = `<div style="display: flex; gap:10px; margin-bottom:20px;justify-content:center;">
      <div>
        <label>Pull:</label>
        <input type="number" id="gambaPull" value="1" style="width:48px;background:#0c0d13;border:1px solid #2B2D44;border-radius:6px;color:#fff;padding:4px 6px;font-size:12px;">
      </div>
    </div>
    <div>
      <button id="gambaBtn" class="btn buyBtn" style="">Pull (multiple)</button>
    </div>
    <div id="gambaNotification" style="display:none; position:fixed; top:20px; right:20px; padding:12px 20px; border-radius:6px; color:#fff; font-weight:600; z-index:9999; max-width:300px; box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>`;

  let gambaResult = [];

  const gamba = wrapper.querySelector("#gambaBtn");
  const spinModal = document.getElementById("spinModal");
  const input = document.querySelector("#gambaPull");

  // Function to show notifications
  function showNotification(message, type = "error") {
    const notification = document.getElementById("gambaNotification");
    notification.textContent = message;

    // Set color based on type
    if (type === "error") {
      notification.style.backgroundColor = "#e74c3c"; // Red for errors
    } else if (type === "success") {
      notification.style.backgroundColor = "#2ecc71"; // Green for success
    } else {
      notification.style.backgroundColor = "#3498db"; // Blue for info
    }

    // Show notification
    notification.style.display = "block";

    // Auto-hide after 3 seconds
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }

  async function gambaSpin(eventId, machineId) {
    const data = new FormData();
    data.append("machine", machineId);
    data.append("event", eventId);

    let json;

    try {
      const res = await fetch("event_spin.php", {
        method: "POST",
        body: data,
        credentials: "same-origin",
      });
      json = await res.json();
    } catch (err) {
      showNotification("Network error. Please check your connection.", "error");
      throw err; // Re-throw to let Promise.allSettled handle it
    }

    if (!json || json.status !== "success") {
      const errorMsg = json && json.message ? json.message : "Spin failed.";
      showNotification(errorMsg, "error");
      throw new Error(errorMsg); // Re-throw to let Promise.allSettled handle it
    }

    return [json.item_name, json.item_img];
  }

  input.addEventListener("input", (e) => {
    const el = e.target.closest(".row").querySelector(".muted strong");
    console.log("wtfmate", el.parentElement);
    el.textContent = ((Number(e.target.value) || 0) * 100).toLocaleString();
  });

  gamba.addEventListener("click", async () => {
    // Get current values from input fields
    const eventId = 4;
    const machineId = 2;
    const totalPull = parseInt(wrapper.querySelector("#gambaPull").value) || 1;

    // Clear previous results
    gambaResult = [];
    let successCount = 0;
    let failedCount = 0;

    // Disable button during processing
    gamba.disabled = true;
    gamba.textContent = "Spinning...";

    // Show starting notification
    showNotification(`Starting ${totalPull} spins...`, "info");

    // Create an array of promises for parallel execution
    const spinPromises = [];
    for (let i = 0; i < totalPull; i++) {
      spinPromises.push(gambaSpin(eventId, machineId));
    }

    // Wait for all promises to settle (either resolve or reject)
    const results = await Promise.allSettled(spinPromises);

    // Process results and collect successful spins
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        successCount++;
        gambaResult.push(result.value);
      } else {
        failedCount++;
      }
    });

    // Re-enable button
    gamba.disabled = false;
    gamba.textContent = "Pull (multiple)";

    // Show results modal with summary
    const resultModal = document.querySelector(".modalOverlay .modalCard");
    resultModal.style.maxWidth = "75%";
    resultModal.style.overflow = "auto";
    resultModal.innerHTML = `
        <div style="font-size:16px;font-weight:600;color:#FFD369;margin-bottom:12px;">
          Pull Results: <span style="color:#2ecc71;">Success: ${successCount}</span>, <span style="color:#e74c3c;">Failed: ${failedCount}</span>
        </div>
        <div style="font-size:14px;color:#fff;margin-bottom:12px;">You got:</div>
        <div id="gambaItemsContainer" style="display:flex;flex-wrap:wrap;gap:10px;overflow: auto;justify-content: center;"></div>
      `;

    // Add items to the modal
    const itemsContainer = document.getElementById("gambaItemsContainer");
    // Assuming `gambaResult` is an array like: [['itemName1', 'itemImage1'], ['itemName1', 'itemImage1'], ['itemName2', 'itemImage2'], ...]

    const itemCountMap = {};

    // Count the occurrences of each item by its name (title)
    gambaResult.forEach((item) => {
      const itemName = item[0]; // Item name (title)
      if (itemCountMap[itemName]) {
        itemCountMap[itemName].count++; // Increment count for the existing item
      } else {
        itemCountMap[itemName] = {
          src: item[1], // Store image src (URL)
          count: 1, // Initialize count as 1 for the first occurrence
        };
      }
    });

    // Create images with counts for each unique item
    Object.keys(itemCountMap).forEach((itemName) => {
      const newItem = document.createElement("div"); // Wrap in a div to hold image and count

      const img = document.createElement("img");
      img.src = itemCountMap[itemName].src; // Image source
      img.className = "modalItemImg";
      img.title = itemName; // Title (name) on hover

      // Create the count element
      const count = document.createElement("span");
      count.className = "itemCount"; // Add a class for styling (optional)
      count.textContent = itemCountMap[itemName].count; // Display the count

      newItem.appendChild(img);
      newItem.appendChild(count);

      itemsContainer.appendChild(newItem);
    });

    const modalClose = document.createElement("div");
    modalClose.className = "closeBtn";
    modalClose.textContent = "Close";
    modalClose.addEventListener("click", () => {
      spinModal.style.display = "none";
    });

    resultModal.appendChild(modalClose);

    spinModal.style.display = "flex";

    // Show summary notification
    if (failedCount === 0) {
      showNotification(
        `All ${successCount} pulls completed successfully!`,
        "success"
      );
    } else if (successCount === 0) {
      showNotification(`All ${failedCount} pulls failed!`, "error");
    } else {
      showNotification(
        `${successCount} successful, ${failedCount} failed`,
        "info"
      );
    }
  });
})();
