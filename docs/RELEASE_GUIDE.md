# Release Guide

Use this guide when publishing a new version of Local Prompt Studio.

## 1. Update Version

Edit `package.json`:

```json
"version": "1.0.1"
```

Use a simple version pattern:

```text
1.0.0
1.0.1
1.1.0
2.0.0
```

## 2. Test

Run:

```bash
npm install
npm run test:syntax
npm start
```

Check:

- App opens
- LM Studio environment check works
- Model refresh works
- Image drag/drop works
- Prompt generation works
- Project save/load works
- Prompt history works

## 3. Build Installer

Run:

```bash
npm run build
```

Build output appears in:

```text
dist/
```

For Windows users, upload the installer file from `dist`.

## 4. Create GitHub Release

On GitHub:

1. Open the repository.
2. Go to `Releases`.
3. Click `Draft a new release`.
4. Create a tag such as `v1.0.1`.
5. Add release notes.
6. Upload the installer from `dist`.
7. Publish the release.

## Does GitHub Automatically Update Installed Apps?

No.

When you push to GitHub, the repository and documentation update immediately.

But users who already installed the app must download the new installer unless an auto-updater is added.

## Future Auto-Update Option

To make installed apps update automatically, add Electron auto-update support.

Common options:

- `electron-updater`
- GitHub Releases as the update provider
- Code signing for smoother Windows installation

This can be added later. For the first public version, manual GitHub Releases are simpler and safer.

