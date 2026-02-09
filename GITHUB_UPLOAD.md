# Step-by-step: Push Cat & Fish to Your GitHub

Your project is already committed. Follow these steps to upload it to **https://github.com/kiran0913/cat-game**.

---

## Step 1: Open a terminal in the project folder

1. Open **Cursor** (or your code editor).
2. Open the **cat-game** folder as your project.
3. Open the terminal:
   - **Shortcut:** Press **Ctrl + `** (backtick), or
   - **Menu:** **Terminal** → **New Terminal**

4. Check that you're in the right folder. You should see something like:
   ```
   PS C:\Users\Home\Desktop\cat-game>
   ```
   If you're somewhere else, type:
   ```
   cd C:\Users\Home\Desktop\cat-game
   ```
   and press **Enter**.

---

## Step 2: Check that Git is ready (optional)

Type this and press **Enter**:

```
git status
```

You should see something like **"Your branch is ahead of 'origin/main' by 1 commit"**. That means you're ready to push.

---

## Step 3: Push to GitHub

Type this and press **Enter**:

```
git push origin main
```

---

## Step 4: Sign in to GitHub (if asked)

Git might ask for your username and password.

- **Username:** Your GitHub username (e.g. **kiran0913**).
- **Password:** GitHub no longer accepts your account password here. You must use a **Personal Access Token**.

### How to create a Personal Access Token

1. Open a browser and go to **https://github.com**.
2. Click your **profile picture** (top right) → **Settings**.
3. In the left sidebar, scroll down and click **Developer settings**.
4. Click **Personal access tokens** → **Tokens (classic)**.
5. Click **Generate new token** → **Generate new token (classic)**.
6. Give it a name (e.g. **cat-game**).
7. Choose an expiry (e.g. **90 days** or **No expiration**).
8. Under **Scopes**, check **repo** (full control of private repositories).
9. Click **Generate token** at the bottom.
10. **Copy the token** (it looks like `ghp_xxxxxxxxxxxx`) and save it somewhere safe. You won’t see it again.

When Git asks for a password, **paste this token** (not your GitHub account password).

---

## Step 5: Confirm the upload

When the push succeeds, you’ll see something like:

```
Enumerating objects: ...
Writing objects: 100% ...
To https://github.com/kiran0913/cat-game.git
   xxxxx..yyyyy  main -> main
```

1. Open your browser and go to **https://github.com/kiran0913/cat-game**.
2. You should see the latest files (including **ios** folder, **APP_STORE_GUIDE.md**, **IOS_DEPLOY.md**, etc.).

---

## If something goes wrong

**"Permission denied" or "Authentication failed"**

- Use a **Personal Access Token** as the password (see Step 4), not your GitHub password.

**"Updates were rejected"**

- Someone else may have pushed to the repo. Run:
  ```
  git pull origin main
  ```
  Then run again:
  ```
  git push origin main
  ```

**"git is not recognized"**

- Install Git: https://git-scm.com/download/win  
- Restart the terminal and try again.

---

## Quick copy-paste summary

In the terminal (in the **cat-game** folder):

```
cd C:\Users\Home\Desktop\cat-game
git push origin main
```

When asked for password, use your **Personal Access Token**, not your GitHub password.
