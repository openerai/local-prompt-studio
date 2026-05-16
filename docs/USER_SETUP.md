# User Setup Guide

This guide is for first-time users who have never used LM Studio.

## 1. Install Local Prompt Studio

Download the latest installer from the GitHub Releases page.

Run the installer and open Local Prompt Studio.

## 2. Install LM Studio

Local Prompt Studio uses LM Studio to run local models.

Install LM Studio from:

```text
https://lmstudio.ai/
```

On Windows, this repository also includes:

```text
INSTALL_LM_STUDIO.cmd
```

That script attempts to install LM Studio with winget.

## 3. Download a Vision Model in LM Studio

Open LM Studio.

Use LM Studio's model search/download feature to get a model that can read images. Look for terms such as:

```text
vision
vl
llava
qwen-vl
multimodal
```

If a model requires a projector or mmproj file, set that up inside LM Studio.

## 4. Load the Model

In LM Studio, load the model into memory.

The model must be loaded before Local Prompt Studio can use it.

## 5. Start the Local Server

Local Prompt Studio can try to start the LM Studio local server automatically.

If that does not work, open LM Studio and enable the local server/API manually.

Default server:

```text
http://127.0.0.1:1234/v1
```

## 6. Use Local Prompt Studio

1. Click `환경 체크`.
2. Click `자동 준비` if something is missing.
3. Click `Refresh` next to the model list.
4. Select the loaded LM Studio model.
5. Drag an image into the workspace.
6. Choose a result style:
   - 태그형
   - 문장형
   - 시스템 프롬프트형
7. Click `프롬프트 생성`.

## Where Projects Are Saved

Projects are saved in the app data folder:

```text
C:\Users\<YOUR_NAME>\AppData\Roaming\local-prompt-studio\projects
```

Inside the app, click `폴더 열기` to open this folder directly.

## Image Storage

By default, the app stores only the original image path to save disk space.

If you enable `이미지를 프로젝트에 복사 저장`, the image is copied into the project folder. This makes projects easier to move, but uses more disk space.

