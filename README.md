# Local Prompt Studio

Local Prompt Studio is a Windows desktop app for turning reference images into reusable image-generation prompts with a local model running in LM Studio.

The app is designed for a simple workflow:

1. Load a vision-capable model in LM Studio.
2. Drag an image into Local Prompt Studio.
3. Generate prompts in tag, sentence, or structured system-prompt format.
4. Save projects with image references and prompt history.

## Features

- LM Studio-first local model workflow
- Environment check for LM Studio, local server, and loaded models
- Drag-and-drop image workspace
- Project save/load with prompt history per image
- GitHub Releases based automatic update checks
- Output styles:
  - Tag style
  - Sentence style
  - Structured system prompt style
- SFW/adult-only prompt handling controls
- Dark premium UI with gold-accented controls

## Important

Local Prompt Studio does not run raw GGUF, safetensors, or model files directly.

Models must be downloaded, imported, and loaded in LM Studio first. Local Prompt Studio connects to the LM Studio local API at:

```text
http://127.0.0.1:1234/v1
```

## For Users

If you only want to use the app, download the latest installer from GitHub Releases.

Then read:

- [User Setup Guide](docs/USER_SETUP.md)
- [Model Guide](docs/LM_STUDIO_MODELS.md)

## For Developers

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm start
```

Run syntax checks:

```bash
npm run test:syntax
```

Build a Windows installer:

```bash
npm run build
```

The build output is created in:

```text
dist/
```

## Updating Users

Pushing updates to GitHub updates the repository and documentation immediately.

Installed apps can check GitHub Releases for newer versions. Users can also click `업데이트 확인` inside the app.

Auto-update works only for packaged installer builds. During `npm start`, the app is in development mode and skips update checks.

See:

- [Release Guide](docs/RELEASE_GUIDE.md)
- [GitHub Upload Guide](docs/GITHUB_UPLOAD.md)
