# Why "gh-pages" doesn't show – and how to fix it

The **gh-pages** branch is **created by the workflow** when it runs. It won't be in the Branch list until that has happened.

Do these steps in order.

---

## Step 1: Make sure the workflow is on GitHub

1. Open **https://github.com/kiran0913/cat-game**
2. Open the **Actions** tab.
3. In the **left sidebar**, look for **"Deploy to gh-pages branch"**.

- **If you see it:** go to **Step 2**.
- **If you don’t see it:** the workflow file isn’t on GitHub yet. Push your latest code:
  - On your PC, in the project folder, run:
    ```bash
    git add -A
    git commit -m "Add gh-pages deploy workflow"
    git push origin main
    ```
  - Then refresh the GitHub Actions page and look again for **"Deploy to gh-pages branch"**.

---

## Step 2: Run the workflow so it creates gh-pages

1. In the repo, go to **Actions**.
2. Click **"Deploy to gh-pages branch"** in the left sidebar.
3. On the right, click **"Run workflow"** (dropdown button).
4. Click the green **"Run workflow"** button.
5. Wait 1–2 minutes. The run should finish with a **green tick**.
6. If it’s **red**, click the run and read the error (e.g. “npm ci” or “npm run build” failed) and fix it.

When this run succeeds, GitHub **creates** the **gh-pages** branch and fills it with the built game.

---

## Step 3: Select gh-pages in Settings → Pages

1. Go to **Settings** → **Pages**.
2. Under **Build and deployment**:
   - **Source:** **Deploy from a branch**.
   - **Branch:** open the dropdown.

If **gh-pages** is in the list, choose **gh-pages** and **/ (root)**.

If you still don’t see **gh-pages**:

- **Refresh the page** (F5 or reload).
- In the **Branch** dropdown, **type** `gh-pages` and see if it appears.
- Check that the workflow run from Step 2 really **succeeded** (green tick). If it failed, fix the error and run it again.

Then click **Save**.

---

## Step 4: Open your game

Wait 1–2 minutes, then open:

**https://kiran0913.github.io/cat-game/**

---

## Summary

| What you see | What to do |
|--------------|------------|
| No "Deploy to gh-pages branch" in Actions | Push your code so the workflow file is on GitHub, then run the workflow. |
| Workflow not run yet | Actions → "Deploy to gh-pages branch" → Run workflow → wait for green tick. |
| Workflow failed (red) | Open the run, read the error, fix it (e.g. build error), run again. |
| Branch list still has no gh-pages | Refresh Settings → Pages; type `gh-pages` in the Branch box; confirm the last run succeeded. |

The **gh-pages** branch only appears **after** the **"Deploy to gh-pages branch"** workflow has run **successfully** at least once.
