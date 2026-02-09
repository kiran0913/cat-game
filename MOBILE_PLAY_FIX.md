# Fix: Can't Play Game on Mobile (kiran0913.github.io/cat-game/)

Follow these steps in order.

---

## Step 1: Make sure the site is built and deployed with GitHub Actions

Your game only works when the **built** version is deployed, not the raw source code.

1. Open **https://github.com/kiran0913/cat-game**
2. Click the **Actions** tab.
3. Check the latest workflow run:
   - If you see **"Deploy to GitHub Pages"** with a green tick ✓, the site is built and deployed.
   - If there is no run or it failed (red ✗), the URL may be serving the wrong files or nothing.

4. Set GitHub Pages to use the workflow:
   - In the repo, go to **Settings** → **Pages** (left sidebar).
   - Under **Build and deployment**:
     - **Source** must be **"GitHub Actions"** (not "Deploy from a branch").
   - If you change it, save. Wait 1–2 minutes.

---

## Step 2: Trigger a fresh deploy (if needed)

1. In the repo, go to the **Actions** tab.
2. Click **"Deploy to GitHub Pages"** in the left sidebar.
3. Click **"Run workflow"** (right side) → **"Run workflow"** again.
4. Wait until the run finishes (green ✓).
5. Then wait **1–2 minutes** for the site to update.

---

## Step 3: Open the correct URL on your phone

Use this exact URL (with `https` and the trailing slash):

**https://kiran0913.github.io/cat-game/**

- Use **Chrome** or **Safari** on your phone.
- If it doesn’t load or shows a blank page, try:
  - **Hard refresh:** pull down to refresh, or close the tab and open the URL again.
  - **Private/Incognito** window to avoid cache.

---

## Step 4: How to play on mobile

1. When the page loads, you may see **"How to play"** and **"Tap anywhere to start"**.
2. **Tap anywhere on the game area** to dismiss that and start.
3. **Touch and hold** on the game (the sea/canvas) and move your finger — the cat moves toward your finger.
4. **Double-tap** on the game to dash.

If the screen is blank or only the header (Score, Lives, etc.) shows and the game area is empty, the built files are not being served — go back to Step 1 and Step 2.

---

## Step 5: If it still doesn’t work

**Check on a computer first:**

- Open **https://kiran0913.github.io/cat-game/** in Chrome on your laptop/PC.
- If it works there but not on the phone, try another browser on the phone (e.g. Chrome vs Safari) and a different network (Wi‑Fi vs mobile data).

**Check the address:**

- It must be **https** (not http).
- It must be **kiran0913.github.io/cat-game/** (with `/cat-game/` at the end).

**Clear cache on the phone:**

- In the browser settings, clear browsing data / cache for this site, then open the URL again.

---

## Summary checklist

- [ ] **Settings → Pages** → Source = **GitHub Actions**
- [ ] **Actions** tab → latest **"Deploy to GitHub Pages"** run is **green** ✓
- [ ] Open **https://kiran0913.github.io/cat-game/** on the phone
- [ ] Tap the game area to start, then touch-and-hold to move the cat
