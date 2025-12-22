# veyra-hud

UI enhancements and helper scripts to make interacting with **Veyra** smoother, faster, and more convenient.  
This project is designed to run as a **userscript** through Tampermonkey, making installation simple.

---

## 🚀 What is veyra-hud?

veyra-hud adds HUD improvements, QoL tools, and browser-side enhancements to the Veyra front end.  
Because it runs in Tampermonkey, it works across browsers and is even available on mobile browsers.

---

## ✨ Features

- UI tweaks and layout improvements
- Buttons, shortcut tools, and quality-of-life enhancements
- Inventory management

### ui-improvements.js

- Menu modifications
  - ~~moves halloween event to bottom of menu (event is currently over)~~ This link was finally removed in vanilla.
  - ~~adds Lizardman Winter event link to nav bar~~ This is now on vanilla.
  - adds link to Wave 3
  - adds link to Adventurer's Guild
  - adds link to Legendary Forge
  - fairly easy to add custom links using `addMenuLinkAfter`
- Wave Page
  - Modified `Loot X monsters` feature to be _significantly_ faster
  - Adds `In Battle:` count to show how many battles you are currently in.
  - Adds `Attack Strategy` to the multi target menu.
  - Adds a `Settings` button for `Attack Stragegy`.
    - Tap name of attack to add to atrategy, arrange in order (top is first)
  - Strategy attack button now shows stamina cost
- Battlepass
  - all 3 tiers are now linked when scrolling
  - auto scrolls to current level of battlepass.
- Merchant
  - Adds a buy {max} button to each item in stock so you can buy the max available
  - Adds a quantity input box for purchase of FSP using gems

---

## 📦 Installation

### 1. Install Tampermonkey

Tampermonkey is required to run the veyra-hud user scripts.

#### Chrome / Brave / Edge

1. Open the Web Store:  
   https://www.tampermonkey.net/?ext=dhdg&browser=chrome
2. Click **Add to Chrome**
3. Approve the extension

#### Firefox

1. Open the Add-ons page:  
   https://www.tampermonkey.net/?ext=dhdg&browser=firefox
2. Click **Add to Firefox**
3. Approve permissions

#### Safari

1. Install from the Mac App Store:  
   https://www.tampermonkey.net/?ext=dhdg&browser=safari

After installation, you should see a **Tampermonkey icon** in your browser toolbar.

---

## 🧩 Installing veyra-hud scripts

1. Open **Tampermonkey Dashboard**  
   (click the Tampermonkey icon → _Dashboard_)

2. Click **“+ Create a new script”** or **“Import”**

3. Copy the contents of the provided script file from this repo  
   (located in `src/`)

4. Paste it into the Tampermonkey editor (overwrite the pre-filled boilerplate)

5. Click **File → Save** (or press `Ctrl+S`)

6. Make sure the script is **Enabled**  
   (toggle switch should be ON in the Tampermonkey script list)

7. Reload Veyra in your browser
