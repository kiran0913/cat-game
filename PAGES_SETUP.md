# GitHub Pages setup – where to find the options

If you **don’t see “GitHub Actions”** under Pages, use the **branch** method below.

---

## Where the settings are

1. Open your repo: **https://github.com/kiran0913/cat-game**
2. Click **Settings** (top menu of the repo, next to Insights).
3. In the **left sidebar**, under “Code and automation”, click **Pages**.

You should see a section **“Build and deployment”** with:

- **Source** (a dropdown)

What you see in the **Source** dropdown can be:

- **“Deploy from a branch”** – everyone has this.
- **“GitHub Actions”** – some accounts see this; if you don’t, use the branch method below.

---

## Option A: If you DO see “GitHub Actions”

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **“GitHub Actions”**.
3. Save. Your site will be built and deployed by the **“Deploy to GitHub Pages”** workflow.

---

## Option B: If you DON’T see “GitHub Actions” – use a branch

Use this so you only need **“Deploy from a branch”**.

### Step 1: Run the new workflow once

1. In your repo, go to the **Actions** tab.
2. In the left sidebar you should see **“Deploy to gh-pages branch”** (in addition to “Deploy to GitHub Pages”).
3. Click **“Deploy to gh-pages branch”**.
4. On the right, click **“Run workflow”** → **“Run workflow”**.
5. Wait until the run finishes with a **green tick** (about 1–2 minutes).  
   This creates the **gh-pages** branch and puts the built game there.

### Step 2: Set Pages to use that branch

1. Go to **Settings → Pages**.
2. Under **Build and deployment**:
   - **Source**: choose **“Deploy from a branch”**.
   - **Branch**: choose **“gh-pages”** and **“/ (root)”**.
3. Click **Save**.

### Step 3: Wait and open the site

- Wait 1–2 minutes.
- Open: **https://kiran0913.github.io/cat-game/**

From now on, every push to **main** will run the workflow and update the **gh-pages** branch, and your site will update automatically.

---

## If “Pages” is not in the sidebar

- Make sure you’re in the **repo** (e.g. kiran0913/cat-game), not your **profile** or **organization**.
- You must be on the **main** (or default) branch and have **Settings** permission (repo owner or admin).
- If you still don’t see **Pages**, try: **Settings** → scroll down the left sidebar to **“Pages”** under **Code and automation**.

---

## Summary

- **Source** is under **Settings → Pages → Build and deployment**.
- If you don’t see **“GitHub Actions”**, use **Option B**: run **“Deploy to gh-pages branch”** once, then set **Source** to **“Deploy from a branch”**, branch **gh-pages**, folder **/ (root)**.
