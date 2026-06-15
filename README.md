# Local Prompt Studio

Local Prompt Studio is a Windows desktop app that turns reference images into reusable image-generation prompts with a local vision model.

The app is designed for people who want a simple local workflow:

1. Run a local model server such as LM Studio or Ollama.
2. Drag an image into Local Prompt Studio.
3. Generate prompts in tag, sentence, or structured system-prompt format.
4. Save projects with image references and prompt history.

## Download

For normal users, install the app from GitHub Releases:

```text
https://github.com/openerai/local-prompt-studio/releases
```

Open the newest release, download the Windows `.exe` installer from `Assets`, and run it.

Do not use the green `Code` button unless you are a developer. That downloads the source code, not the easy installer.

## Local Model Requirement

Local Prompt Studio does not run GGUF, safetensors, or model files directly.

Use one of these local model runners:

- LM Studio with a loaded vision model and local server enabled
- Ollama with a vision model such as `llava`, `bakllava`, `moondream`, or another image-capable model

Default local endpoints:

```text
LM Studio: http://127.0.0.1:1234/v1
Ollama:    http://127.0.0.1:11434
```

Inside the app, click `환경 체크`, then `Refresh`, then choose a detected model.

## Features

- Local-first image prompt generation
- LM Studio and Ollama model detection
- Model test button for checking whether image input works
- Drag-and-drop image workspace
- WebP image conversion before model requests
- Project save/load with prompt history per image
- Optional image copy mode for portable projects
- GitHub Releases based automatic updates
- Output styles:
  - Tag style
  - Sentence style
  - Structured system prompt style
- SFW/adult-only prompt handling controls
- Dark premium UI with gold-accented controls

## Korean Guide

한국어 설치 안내는 아래 문서를 보세요.

- [한국어 사용자 설치 가이드](docs/KO_USER_SETUP.md)

## Project Storage

Projects are saved in the app data folder:

```text
C:\Users\<YOUR_NAME>\AppData\Roaming\local-prompt-studio\projects
```

Inside the app, click `폴더 열기` to open that folder.

By default, the app saves the original image path to reduce disk usage. If you enable image copy mode, the image is copied into the project folder so projects are easier to move, but disk usage increases.

## Development

Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm start
```

Check syntax:

```bash
npm run test:syntax
```

Build a Windows installer:

```bash
npm run build
```

Build output is created in:

```text
dist/
```

## Updating Users

The installed app checks GitHub Releases for newer versions. When a newer release is available, the app downloads it and asks the user to restart and install the update.

Auto-update works only for packaged installer builds. During `npm start`, the app is in development mode and skips update checks.

See:

- [Release Guide](docs/RELEASE_GUIDE.md)
- [GitHub Upload Guide](docs/GITHUB_UPLOAD.md)
