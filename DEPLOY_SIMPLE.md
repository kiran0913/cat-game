# Deploy your game in 3 steps (simple)

Your game will be at: **https://kiran0913.github.io/cat-game/**

---

## Step 1: Build and copy the game into the `docs` folder

On your PC, open a terminal in the **cat-game** folder and run:

```bash
npm run build:docs
```

Wait until it finishes. This builds the game and puts the built files in the **docs** folder.

---

## Step 2: Push to GitHub

In the same folder, run:

```bash
git add docs
git commit -m "Update game for GitHub Pages"
git push origin main
```

Use your GitHub username and **Personal Access Token** (as password) if Git asks.

---

## Step 3: Turn on GitHub Pages (do this once)

1. Open **https://github.com/kiran0913/cat-game**
2. Click **Settings** → in the left sidebar click **Pages**
3. Under **Build and deployment**:
   - **Source:** choose **Deploy from a branch**
   - **Branch:** choose **main**
   - **Folder:** choose **/docs**
4. Click **Save**

Wait 1–2 minutes, then open **https://kiran0913.github.io/cat-game/** on your phone or computer.

---

## When you change the game later

1. Run **Step 1** again: `npm run build:docs`
2. Run **Step 2** again: `git add docs` then `git commit` then `git push`

No need to change Settings again. The site will update automatically after you push.
