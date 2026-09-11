# VSBEC IT Task Manager — Standalone Packaging (EXE & APK)

This directory contains complete, standalone configurations to build:
1. **Windows Desktop Executable (`.exe`)** via Electron
2. **Android Mobile Application (`.apk`)** via Capacitor

> [!NOTE]
> **Root Project Untouched**: None of the original project files in the repository root were modified. This folder is completely self-contained.

---

## 1. Windows Desktop App (`windows-exe/`)

The Windows Desktop app runs natively without requiring Vercel or a web browser. It features an embedded local HTTP proxy that securely handles static assets and routes API requests to your backend without any CORS errors.

### Directory Structure
```
standalone-packaging/windows-exe/
├── main.cjs            # Electron main process (embedded server & window manager)
├── preload.cjs         # Context bridge
├── app-config.json     # Configuration file for Backend API URL
├── web/                # Built React frontend assets
├── package.json        # Dedicated Electron & electron-builder dependencies
├── build-exe.bat       # One-click Windows build script
└── dist-electron/      # Output directory containing the generated .exe
```

### Changing Backend API Target
Edit [app-config.json](file:///c:/Users/tharu/Documents/GITHUB%20REPO/taskmanage%20vercelr/standalone-packaging/windows-exe/app-config.json):
- To connect to your cloud backend (default):
  ```json
  {
    "backendApiUrl": "https://it-taskmanager.vercel.app/api"
  }
  ```
- To connect to a local server running on your PC:
  ```json
  {
    "backendApiUrl": "http://localhost:3000/api"
  }
  ```

### How to Run in Development (Preview Window)
```powershell
cd "standalone-packaging/windows-exe"
npm start
```

### How to Build the `.exe`
Double-click `build-exe.bat` or run:
```powershell
cd "standalone-packaging/windows-exe"
npm run build
```
Once complete, check `dist-electron/`:
- **`VSBEC IT Task Manager.exe`** (Portable, runs directly with no installation needed)
- **`VSBEC IT Task Manager Setup 1.0.1.exe`** (Standard Windows installer)

---

## 2. Android Mobile App (`android-apk/`)

The Android app is configured using **Capacitor** to wrap your React build for mobile devices, complete with an automatic mobile API gateway that routes requests to your backend.

### Directory Structure
```
standalone-packaging/android-apk/
├── capacitor.config.json # Capacitor app settings (App ID: com.vsbec.it.taskmanager)
├── inject-gateway.cjs    # Mobile API gateway injector script
├── www/                  # Mobile web assets
├── package.json          # Capacitor CLI & Android dependencies
└── build-apk.bat         # One-click Android setup & build script
```

### How to Build the APK
1. Double-click `build-apk.bat` or run:
   ```powershell
   cd "standalone-packaging/android-apk"
   npm install
   npx cap add android
   npx cap sync android
   ```
2. Build via Gradle:
   ```powershell
   cd android
   .\gradlew assembleDebug
   ```
   Your APK will be generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
3. Or open directly in Android Studio:
   ```powershell
   npx cap open android
   ```
   Then click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
