# User Setup Guide

This guide is for first-time users who have never used a local vision model runner.

## 1. Install Local Prompt Studio

Download the latest installer from the GitHub Releases page:

```text
https://github.com/openerai/local-prompt-studio/releases
```

Run the Windows `.exe` installer and open Local Prompt Studio.

## 2. Install a Local Model Runner

Local Prompt Studio does not run raw model files directly. It connects to a local model runner.

Supported runners:

- LM Studio
- Ollama

## 3. LM Studio Setup

Install LM Studio from:

```text
https://lmstudio.ai/
```

Open LM Studio and download a model that can read images. Search for terms such as:

```text
vision
vl
llava
qwen-vl
multimodal
```

Load the model in LM Studio and make sure the local server/API is available at:

```text
http://127.0.0.1:1234/v1
```

## 4. Ollama Setup

Install Ollama from:

```text
https://ollama.com/
```

Install a vision model, for example:

```powershell
ollama pull llava
```

Ollama normally runs at:

```text
http://127.0.0.1:11434
```

## 5. Use Local Prompt Studio

1. Click `환경 체크`.
2. Click `자동 준비` if something is missing.
3. Click `Refresh` next to the model list.
4. Select a detected model.
5. Click `모델 테스트` if available.
6. Drag an image into the workspace.
7. Choose a result style:
   - Tag style
   - Sentence style
   - Structured system prompt style
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
