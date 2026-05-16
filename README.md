# Local Prompt Studio

Local Prompt Studio is a Windows desktop app for turning reference images into reusable image-generation prompts with a local model running in LM Studio.

## 한국어 빠른 설치 안내

처음 사용하는 분은 아래 문서를 먼저 보세요.

- [한국어 설치 가이드](docs/KO_USER_SETUP.md)

가장 쉬운 설치 순서:

1. GitHub 페이지 오른쪽의 `Releases`를 클릭합니다.
2. 최신 버전의 `Assets`에서 Windows 설치 파일을 다운로드합니다.
3. 설치 파일을 실행해 Local Prompt Studio를 설치합니다.
4. LM Studio가 없다면 [https://lmstudio.ai/](https://lmstudio.ai/) 에서 설치합니다.
5. LM Studio에서 이미지 인식이 가능한 Vision 모델을 다운로드하고 `Load` 합니다.
6. Local Prompt Studio를 열고 `환경 체크`, `Refresh`를 누른 뒤 모델을 선택합니다.
7. 이미지를 드래그해서 넣고 `프롬프트 생성`을 누릅니다.

주의: GitHub의 초록색 `Code` 버튼으로 받은 zip은 개발자용 소스코드입니다. 일반 사용자는 `Releases`에서 설치 파일을 받는 것이 가장 쉽습니다.

---

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
