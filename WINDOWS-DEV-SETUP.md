# Windows Development Environment Setup

## 1. Install Node.js v12 (64-bit)

Download and install from:
```
https://nodejs.org/dist/latest-v12.x/node-v12.22.12-x64.msi
```

## 2. Install Windows Build Tools

Open **PowerShell as Administrator** and run:
```powershell
npm install --global --production windows-build-tools
```
This installs Python 2.7 and VS Build Tools. Takes 10-15 minutes.

## 3. Install Dependencies

Open a new terminal in the project folder:
```powershell
npm install
```

## 4. Rebuild Native Modules

```powershell
npm run electron:rebuild
```

## 5. Run in Dev Mode

```powershell
npm run start
```

## 6. Build Windows Installer (Optional)

```powershell
npm run electron:windows
```
Output will be in the `release/` folder.
