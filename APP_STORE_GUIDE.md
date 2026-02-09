# Step-by-step: Launch Cat & Fish on the App Store (from Windows)

You can do **most steps on your Windows laptop**. The **last steps (build + submit)** must be done on a **Mac** because Apple only allows iOS apps to be built with Xcode on macOS.

---

## Part 1 — On your Windows laptop (prepare everything)

### Step 1: Open the project

1. Open the project folder in your editor (e.g. Cursor/VS Code).
2. Open a terminal in that folder (e.g. **PowerShell** or **Command Prompt**).

---

### Step 2: Install Node.js (if you don’t have it)

1. Go to [https://nodejs.org](https://nodejs.org).
2. Download the **LTS** version for Windows.
3. Run the installer and follow the prompts.
4. Close and reopen the terminal, then run:
   ```bash
   node -v
   ```
   You should see a version number (e.g. `v20.x.x`).

---

### Step 3: Install project dependencies

In the project folder, run:

```bash
npm install
```

Wait until it finishes (no red errors).

---

### Step 4: Build the game for iOS

Run:

```bash
npm run build:ios
```

You should see something like:

```
✓ built in ...ms
```

This creates/updates the **dist/** folder with the web game, using paths that work inside the iOS app.

---

### Step 5: Copy the build into the iOS project

Run:

```bash
npx cap sync ios
```

This copies the contents of **dist/** into **ios/App/App/public/** so the iOS app will load your game.

---

### Step 6: Get the project onto a Mac

You need the full project (including the **ios** folder) on a Mac. Choose one:

**Option A — USB / cloud drive**

1. Copy the whole project folder (e.g. `cat-game`) to a USB stick or cloud folder (OneDrive, Google Drive, etc.).
2. On the Mac, copy the folder from the USB/cloud into a folder (e.g. Desktop or Documents).

**Option B — Git (if you use GitHub/GitLab)**

1. On Windows, in the project folder:
   ```bash
   git add .
   git commit -m "Prepare for iOS"
   git push
   ```
2. On the Mac, clone the repo:
   ```bash
   git clone <your-repo-url>
   cd cat-game
   ```

**Option C — Rent a Mac in the cloud (no physical Mac)**

- Services like **MacinCloud** or **MacStadium** give you a remote Mac. You upload your project (e.g. via Git or cloud drive), then use that Mac for Part 2 below.

---

## Part 2 — On a Mac (required for App Store)

You must use a Mac for these steps. It can be:

- Your own Mac, or  
- A friend’s Mac, or  
- A cloud Mac (MacinCloud, etc.)

---

### Step 7: Install Xcode (Mac only)

1. On the Mac, open the **App Store**.
2. Search for **Xcode** and click **Get** / **Install**.
3. Wait for the download and installation to finish (it’s large).
4. Open **Xcode** once and accept the license if asked.

---

### Step 8: Install CocoaPods (Mac only, one time)

1. On the Mac, open **Terminal** (Applications → Utilities → Terminal).
2. Run:
   ```bash
   sudo gem install cocoapods
   ```
3. Enter your Mac password when asked.
4. Wait until it finishes.

---

### Step 9: Open the project on the Mac

1. Copy the project onto the Mac (if you haven’t already) so the **cat-game** folder is there, with the **ios** folder inside it.
2. In Terminal, go to the project folder, for example:
   ```bash
   cd ~/Desktop/cat-game
   ```
   (Change the path if your folder is somewhere else.)

3. Install Node dependencies (same as on Windows):
   ```bash
   npm install
   ```

4. Build and sync again on the Mac (so paths are correct on this machine):
   ```bash
   npm run build:ios
   npx cap sync ios
   ```

5. Install iOS dependencies (first time only):
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```

6. Open the project in Xcode:
   ```bash
   npx cap open ios
   ```
   Or: open **Finder → cat-game → ios → App**, then double‑click **App.xcworkspace** (use the **.xcworkspace** file, not the .xcodeproj).

---

### Step 10: Configure the app in Xcode

1. In the left sidebar of Xcode, click the blue **App** project (top of the list).
2. Under **TARGETS**, select **App**.
3. Open the **Signing & Capabilities** tab:
   - Check **Automatically manage signing**.
   - **Team**: choose your Apple ID team. If you don’t see one, click **Add Account** and sign in with your **Apple Developer** account.
   - **Bundle Identifier**: change to something unique, e.g. `com.yourname.catfish`. It must be different from any other app on the App Store.

4. Open the **General** tab:
   - **Display Name**: e.g. `Cat & Fish` (this is the name under the icon on the home screen).
   - **Version**: e.g. `1.0.0`.
   - **Build**: e.g. `1`.

5. **App icon** (required for App Store):
   - In the left sidebar, open **App** → **Assets.xcassets** → **AppIcon**.
   - You need at least one **1024×1024** PNG (no transparency). Add your icon image there (Xcode will show slots for different sizes; you can use “Single Size” and provide 1024×1024).

---

### Step 11: Enroll in Apple Developer Program (if you haven’t)

1. Go to [developer.apple.com](https://developer.apple.com).
2. Sign in with your Apple ID.
3. Go to **Account** → **Membership** and enroll in the **Apple Developer Program** ($99/year).
4. Wait until your enrollment is active (can take a day).

---

### Step 12: Run the app on the Mac (test)

1. In Xcode, at the top, choose a **simulator** (e.g. **iPhone 15**) from the device menu.
2. Click the **Run** (▶) button or press **Cmd + R**.
3. The app should open in the simulator and load your game. If it does, you’re ready to archive.

---

### Step 13: Create an app in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) and sign in.
2. Click **My Apps** → **+** → **New App**.
3. Choose **iOS**, enter:
   - **Name**: e.g. `Cat & Fish`
   - **Primary Language**: e.g. English
   - **Bundle ID**: select the same one you set in Xcode (e.g. `com.yourname.catfish`)
   - **SKU**: any unique code (e.g. `catfish001`)
4. Click **Create**. You’ll add the rest of the info (screenshots, description, etc.) after you upload the first build.

---

### Step 14: Archive and upload the app (from the Mac)

1. In Xcode, at the top, set the device menu to **Any iOS Device (arm64)** (not a simulator).
2. Menu bar: **Product** → **Archive**.
3. Wait for the archive to finish. The **Organizer** window will open.
4. Select the new archive and click **Distribute App**.
5. Choose **App Store Connect** → **Next**.
6. Choose **Upload** → **Next**.
7. Leave options as default (e.g. “Upload your app’s symbols”) → **Next**.
8. Select the correct **Team** and **Distribution certificate** (Xcode can manage this) → **Next**.
9. Click **Upload** and wait. When it’s done, you’ll see a success message.

---

### Step 15: Submit for review in App Store Connect

1. Go back to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **Cat & Fish** (or whatever you named it).
2. The new build may take **5–15 minutes** to appear. When it shows under **Build**, select it.
3. Fill in what’s required:
   - **Screenshots**: at least one for each required device size (e.g. 6.7", 6.5", 5.5"). You can take these in the iOS Simulator (File → New Screen) or on a real device.
   - **Description**: what your game does.
   - **Keywords**: search terms (e.g. `cat, fish, game, casual`).
   - **Support URL**: a webpage or your email (e.g. `https://github.com/yourusername/cat-game`).
   - **Privacy Policy URL**: required; use a simple page that says what data you collect (e.g. “This game does not collect personal data”).
   - **Category**: e.g. **Games** → **Casual**.
   - **Age Rating**: answer the questionnaire (for this game it’s usually 4+).
4. Under **Pricing**, choose **Free** (or set a price).
5. Click **Add for Review** (or **Submit for Review**). Confirm.
6. Apple will review the app (usually 24–48 hours). You’ll get an email when it’s approved or if they need changes.

---

## Quick checklist

**On Windows (you can do this now):**

- [ ] Node.js installed  
- [ ] `npm install`  
- [ ] `npm run build:ios`  
- [ ] `npx cap sync ios`  
- [ ] Project copied to Mac (USB / cloud / Git)

**On Mac (you need access to a Mac):**

- [ ] Xcode installed  
- [ ] CocoaPods installed (`sudo gem install cocoapods`)  
- [ ] `npm install` and `npm run build:ios` and `npx cap sync ios`  
- [ ] `cd ios/App && pod install`  
- [ ] Open **App.xcworkspace** in Xcode  
- [ ] Signing & Capabilities: Team + Bundle ID  
- [ ] App icon 1024×1024 added  
- [ ] Apple Developer Program enrolled  
- [ ] App created in App Store Connect  
- [ ] **Product → Archive** → **Distribute App** → Upload  
- [ ] In App Store Connect: screenshots, description, privacy, category, submit for review  

---

## If you don’t have a Mac

- **Borrow a Mac** from a friend and do Part 2 there.  
- **Rent a cloud Mac**: e.g. [MacinCloud](https://www.macincloud.com/) or [MacStadium](https://www.macstadium.com/) — you connect to it and run the same Mac steps (7–15) there.  
- **Apple Store**: some Apple Stores let you use a Mac; you’d need to bring your project (e.g. on a USB drive or via Git) and do the Xcode/archive/upload steps there (and have your Apple Developer account ready).

Once you’ve done **Steps 1–6 on Windows** and **Steps 7–15 on a Mac**, your game will be submitted to the App Store and, after approval, will be available for download.
