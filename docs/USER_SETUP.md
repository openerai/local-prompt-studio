# User Setup Guide

This guide is for first-time users who have never used a local vision model runner.

The recommended setup is **Ollama first**.

## 1. Install Local Prompt Studio

Download the latest installer from the GitHub Releases page:

```text
https://github.com/openerai/local-prompt-studio/releases
```

Run the Windows `.exe` installer and open Local Prompt Studio.

## 2. Install Ollama

Install Ollama from:

```text
https://ollama.com/
```

Restart Windows if the installer asks you to.

## 3. Download a Vision Model

Open PowerShell and run:

```powershell
ollama pull llava
```

Other image-capable models may also work:

```powershell
ollama pull bakllava
ollama pull moondream
```

Text-only models cannot analyze images. Use a Vision/VL/multimodal model.

## 4. Confirm Ollama Works

Run:

```powershell
ollama list
```

If your model appears, Local Prompt Studio can usually detect it after `Refresh`.

Ollama normally runs at:

```text
http://127.0.0.1:11434
```

This is a local address on the user's own computer.

## 5. Use Local Prompt Studio

1. Click `환경 체크`.
2. Click `Refresh` next to the model list.
3. Select an Ollama model.
4. Click `모델 테스트` if available.
5. Drag a local image file or website image into the workspace.
6. Choose a result style:
   - Tag style
   - Sentence style
   - Structured system prompt style
7. Choose a detail level. `상세` creates a longer element-by-element prompt.
8. Click `프롬프트 생성`.

## Where Projects Are Saved

Projects are saved in the app data folder:

```text
C:\Users\<YOUR_NAME>\AppData\Roaming\local-prompt-studio\projects
```

Inside the app, click `폴더 열기` to open this folder directly.

## Image Storage

By default, the app stores only the original image path to save disk space.

If you enable `이미지를 프로젝트에 복사 저장`, the image is copied into the project folder. This makes projects easier to move, but uses more disk space.

Website images are always copied into the project folder because they do not have a stable local file path.

## Version

The app version is shown in the left sidebar under the app name.
