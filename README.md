# Local Prompt Studio

Local Prompt Studio is a Windows desktop app that turns reference images into reusable image-generation prompts with a local vision model.

The recommended workflow is **Ollama first**:

1. Install Ollama.
2. Download a vision model in Ollama.
3. Open Local Prompt Studio.
4. Press `Refresh` and choose the detected Ollama model.
5. Drag a local image or a website image into the workspace.
6. Generate prompts in tag, sentence, or structured system-prompt format.

## Download

For normal users, install the app from GitHub Releases:

```text
https://github.com/openerai/local-prompt-studio/releases
```

Open the newest release, download the Windows `.exe` installer from `Assets`, and run it.

Do not use the green `Code` button unless you are a developer. That downloads the source code, not the easy installer.

## Quick Start With Ollama

### 1. Install Ollama

Download Ollama from:

```text
https://ollama.com/
```

Install it, then restart the PC if Windows asks you to.

### 2. Install a Vision Model

Open PowerShell and run one of these commands:

```powershell
ollama pull llava
```

Other image-capable model names can also work, depending on your PC and Ollama support:

```powershell
ollama pull bakllava
ollama pull moondream
```

Text-only models cannot analyze images. Use a Vision/VL/multimodal model.

### 3. Confirm Ollama Is Running

Ollama normally runs locally at:

```text
http://127.0.0.1:11434
```

This is a local address on your own computer. It is not a public internet address.

You can test Ollama in PowerShell:

```powershell
ollama list
```

If the model appears in the list, Local Prompt Studio should be able to detect it after pressing `Refresh`.

### 4. Use Local Prompt Studio

1. Open Local Prompt Studio.
2. Press `환경 체크`.
3. Press `Refresh` next to the model list.
4. Select an Ollama model from the model list.
5. Press `모델 테스트` if available.
6. Drag an image into the workspace.
7. Choose an output style: `태그형`, `문장형`, or `시스템 프롬프트형`.
8. Choose detail level. `상세` creates a longer element-by-element prompt.
9. Press `프롬프트 생성`.

## Features

- Ollama-first local model workflow
- Model test button for checking whether image input works
- Drag-and-drop image workspace
- Website image drag-and-drop support
- WebP image conversion before model requests
- Project save/load with prompt history per image
- Optional image copy mode for portable projects
- GitHub Releases based automatic updates
- Version display inside the app
- Output styles:
  - Tag style
  - Sentence style
  - Structured system prompt style
- Detail levels:
  - Concise
  - Balanced
  - Exhaustive element-by-element analysis for longer generation prompts
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
