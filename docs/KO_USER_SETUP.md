# Local Prompt Studio 한국어 설치 가이드

이 문서는 GitHub, 로컬 LLM, LM Studio, Ollama에 익숙하지 않은 사용자를 위한 안내입니다.

Local Prompt Studio는 이미지를 넣으면 로컬 AI 모델을 사용해 이미지 생성용 프롬프트를 만들어 주는 Windows 데스크톱 앱입니다.

## 1. 프로그램 다운로드

GitHub 저장소로 이동합니다.

```text
https://github.com/openerai/local-prompt-studio
```

오른쪽 영역의 `Releases`에서 최신 버전을 엽니다.

`Assets` 아래에서 Windows 설치 파일을 다운로드합니다.

파일 이름은 보통 이런 형태입니다.

```text
Local-Prompt-Studio-1.0.1-win-x64.exe
```

초록색 `Code` 버튼은 개발자용 소스코드를 받는 버튼입니다. 일반 사용자는 `Releases`에서 `.exe` 설치 파일을 받는 것이 가장 쉽습니다.

## 2. 로컬 모델 실행기 설치

Local Prompt Studio는 모델 파일을 직접 실행하지 않습니다. 모델을 실행해 주는 프로그램이 따로 필요합니다.

추천 방식은 둘 중 하나입니다.

- LM Studio
- Ollama

처음 사용하는 분에게는 LM Studio가 더 눈으로 확인하기 쉽습니다. Ollama는 명령어 기반 사용에 익숙한 분에게 좋습니다.

## 3. LM Studio를 사용할 때

LM Studio를 설치합니다.

```text
https://lmstudio.ai/
```

LM Studio에서 이미지 분석이 가능한 Vision 모델을 다운로드하고 `Load` 합니다.

검색할 때 이런 단어가 들어간 모델을 찾으면 좋습니다.

```text
vision
vl
llava
qwen-vl
multimodal
```

LM Studio의 Local Server/API가 켜져 있어야 합니다.

기본 주소는 아래와 같습니다.

```text
http://127.0.0.1:1234/v1
```

## 4. Ollama를 사용할 때

Ollama를 설치합니다.

```text
https://ollama.com/
```

이미지를 읽을 수 있는 모델을 설치합니다.

예:

```powershell
ollama pull llava
```

Ollama 기본 주소는 아래와 같습니다.

```text
http://127.0.0.1:11434
```

## 5. 앱에서 모델 연결하기

1. Local Prompt Studio를 실행합니다.
2. `환경 체크`를 누릅니다.
3. `Refresh`를 누릅니다.
4. 목록에 나온 모델을 선택합니다.
5. `모델 테스트`가 보이면 먼저 눌러 이미지 입력이 되는지 확인합니다.
6. 이미지를 작업공간에 드래그합니다.
7. 결과 스타일을 선택합니다.
   - 태그형
   - 문장형
   - 시스템 프롬프트형
8. `프롬프트 생성`을 누릅니다.

## 6. WebP 이미지가 안 될 때

최신 버전은 WebP 이미지를 내부에서 PNG로 변환한 뒤 모델에 보냅니다.

그래도 실패하면 다음을 확인하세요.

- 모델이 Vision 모델인지 확인
- LM Studio 또는 Ollama에서 모델이 실제로 로드되어 있는지 확인
- 너무 큰 이미지는 줄여서 다시 시도

## 7. 프로젝트 저장 위치

프로젝트는 아래 폴더에 저장됩니다.

```text
C:\Users\<사용자이름>\AppData\Roaming\local-prompt-studio\projects
```

앱 안의 `폴더 열기` 버튼을 누르면 이 위치를 바로 열 수 있습니다.

기본 설정에서는 이미지 원본 경로만 저장해 용량을 아낍니다. `이미지를 프로젝트에 복사 저장`을 켜면 이미지 파일도 프로젝트 폴더에 복사됩니다. 이 방식은 다른 PC로 옮기기 쉽지만 용량을 더 사용합니다.

## 8. 업데이트

설치형 앱은 GitHub Releases에서 새 버전을 확인합니다.

새 버전이 있으면 앱이 다운로드하고, 다시 시작해서 설치하라는 안내를 보여줍니다.

개발자 모드인 `npm start`에서는 자동 업데이트가 동작하지 않습니다.
