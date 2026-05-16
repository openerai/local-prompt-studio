# GitHub Upload Guide

This guide explains how to upload Local Prompt Studio to GitHub.

## 1. Create a GitHub Repository

On GitHub, create a new repository.

Recommended name:

```text
local-prompt-studio
```

Choose public or private.

Do not add a README on GitHub if this project already has one locally.

## 2. Connect Local Project to GitHub

In PowerShell inside the project folder:

```bash
git status
git add .
git commit -m "Initial release"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/local-prompt-studio.git
git push -u origin main
```

Replace `YOUR_NAME` with your GitHub username.

## 3. Updating GitHub Later

After editing the app:

```bash
git status
git add .
git commit -m "Describe the update"
git push
```

The GitHub repository updates immediately after `git push`.

## 4. Updating Installed Users

Repository updates do not automatically update installed apps.

For users:

1. Build a new installer with `npm run build`.
2. Create a new GitHub Release.
3. Upload the installer.
4. Tell users to download and install the new version.

Automatic app updates require an extra updater system.

