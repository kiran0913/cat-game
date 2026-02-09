# Launch Cat & Fish on the iOS App Store

This project is set up with **Capacitor** so you can build a native iOS app and submit it to the App Store.

## What you need

- **Mac** with **Xcode** (from the Mac App Store) — required to build and submit the iOS app
- **CocoaPods** on the Mac (`sudo gem install cocoapods`) — run `pod install` inside `ios/App` the first time you open the project on a Mac
- **Apple Developer account** ($99/year) for App Store submission
- **Node.js** (v18 or newer recommended)

---

## Step 1: Install dependencies

```bash
npm install
```

## Step 2: Add the iOS platform (first time only)

If the `ios/` folder is not in the project yet:

```bash
npx cap add ios
```

This creates an `ios/` folder with the Xcode project. **On a Mac**, after opening the project, go to `ios/App` and run `pod install` if Xcode asks for it (CocoaPods is required on macOS).

## Step 3: Build the web app for iOS

```bash
npm run build:ios
```

This builds your game into `dist/` with paths that work inside the iOS app.

## Step 4: Copy the build into the iOS project

```bash
npx cap sync ios
```

Or use the shortcut that builds and syncs in one go:

```bash
npm run cap:sync
```

## Step 5: Open in Xcode

```bash
npx cap open ios
```

Or run:

```bash
npm run cap:ios
```

This opens the `ios/App/App.xcworkspace` (or `ios/App/App.xcodeproj`) in Xcode.

---

## Step 6: Configure the app in Xcode

1. In the left sidebar, click the **App** (blue) project.
2. Select the **App** target.
3. **Signing & Capabilities**:
   - Choose your **Team** (your Apple Developer account).
   - Set a unique **Bundle Identifier** (e.g. `com.yourname.catfish`).  
     Default in this project: `com.catfish.game`.
4. **General**:
   - Set **Display Name** to `Cat & Fish` (or the name you want on the home screen).
   - Set **Version** and **Build** (e.g. 1.0.0 and 1).
5. **App Icons**:
   - Add your app icon in **Assets.xcassets** → **AppIcon** (required sizes: 1024×1024 for App Store, plus smaller sizes Xcode lists).

---

## Step 7: Run on a device or simulator

- Choose a **simulator** or a **connected iPhone** from the device menu.
- Press **Run** (▶) or `Cmd + R`.

---

## Step 8: Submit to the App Store

1. In Xcode menu: **Product** → **Archive**.
2. When the archive is done, the **Organizer** window opens.
3. Click **Distribute App**.
4. Choose **App Store Connect** → **Upload**.
5. Follow the prompts (signing, options, upload).
6. In [App Store Connect](https://appstoreconnect.apple.com):
   - Create an app (if needed) and link it to the uploaded build.
   - Fill in **name**, **description**, **screenshots**, **privacy**, **pricing**, etc.
   - Submit for review.

---

## Useful commands

| Command | Description |
|--------|--------------|
| `npm run build:ios` | Build the web game for iOS (output in `dist/`) |
| `npm run cap:sync` | Build for iOS and copy into the iOS project |
| `npm run cap:ios` | Build, sync, and open the project in Xcode |

After you change the web game, run **`npm run cap:sync`** (or `npm run cap:ios`) before running or archiving in Xcode so the iOS app uses the latest build.

---

## Changing the app ID or name

Edit **`capacitor.config.js`** in the project root:

- **appId**: e.g. `com.yourcompany.catfish` (must be unique; use your own for the store).
- **appName**: Name used by the system (e.g. `Cat & Fish`).

Then run `npx cap sync ios` again. If you already changed the bundle ID in Xcode, keep it the same there or update both so they match.

---

## Troubleshooting

- **“No such module ‘Capacitor’”**  
  Run `npm install` and then `npx cap sync ios`, and open the **.xcworkspace** (not the .xcodeproj) in Xcode.

- **Blank or broken screen on device**  
  Make sure you ran `npm run build:ios` and `npx cap sync ios` so `dist/` is up to date and copied into the iOS app.

- **Signing errors**  
  In Xcode → **Signing & Capabilities**, select your Team and ensure **Automatically manage signing** is on (or fix provisioning manually).

- **App Store rejection**  
  Follow [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/). For a game, provide clear description, screenshots, and privacy details; ensure the app works offline if you claim it does.
