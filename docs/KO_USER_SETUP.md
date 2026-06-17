# Local Prompt Studio 한국어 설치 가이드

이 문서는 GitHub, 로컬 LLM, Ollama에 익숙하지 않은 사용자를 위한 안내입니다.

Local Prompt Studio는 이미지를 넣으면 로컬 AI 모델을 사용해 이미지 생성용 프롬프트를 만들어 주는 Windows 데스크톱 앱입니다.

현재 권장 방식은 **Ollama 중심 워크플로우**입니다. LM Studio도 사용할 수 있지만, 처음 사용하는 분에게는 Ollama 기준으로 안내합니다.

## 1. 프로그램 다운로드

GitHub 저장소로 이동합니다.

```text
https://github.com/openerai/local-prompt-studio
```

오른쪽 영역의 `Releases`에서 최신 버전을 엽니다.

`Assets` 아래에서 Windows 설치 파일을 다운로드합니다.

파일 이름은 보통 이런 형태입니다.

```text
Local-Prompt-Studio-1.0.2-win-x64.exe
```

초록색 `Code` 버튼은 개발자용 소스코드를 받는 버튼입니다. 일반 사용자는 `Releases`에서 `.exe` 설치 파일을 받는 것이 가장 쉽습니다.

## 2. Ollama 설치

Ollama를 설치합니다.

```text
https://ollama.com/
```

Windows 설치 파일을 실행한 뒤, 필요하면 PC를 다시 시작합니다.

## 3. 이미지 인식 모델 받기

PowerShell을 열고 아래 명령을 실행합니다.

```powershell
ollama pull llava
```

다른 Vision 모델을 사용할 수도 있습니다.

```powershell
ollama pull bakllava
ollama pull moondream
```

중요: 일반 텍스트 모델은 이미지를 읽지 못합니다. 이미지 분석에는 Vision, VL, multimodal 모델이 필요합니다.

## 4. Ollama 모델 확인

PowerShell에서 아래 명령을 실행합니다.

```powershell
ollama list
```

방금 받은 모델 이름이 보이면 준비가 된 것입니다.

Ollama 기본 주소는 아래와 같습니다.

```text
http://127.0.0.1:11434
```

`127.0.0.1`은 내 컴퓨터 안에서만 쓰는 로컬 주소입니다. 공개 서버 주소가 아니므로 문서에 적혀 있어도 괜찮습니다.

## 5. 앱에서 모델 연결하기

1. Local Prompt Studio를 실행합니다.
2. `환경 체크`를 누릅니다.
3. `Refresh`를 누릅니다.
4. 목록에 나온 Ollama 모델을 선택합니다.
5. `모델 테스트`가 보이면 먼저 눌러 이미지 입력이 되는지 확인합니다.
6. 로컬 이미지 파일 또는 웹사이트 이미지를 작업공간에 드래그합니다.
7. 결과 스타일을 선택합니다.
   - 태그형
   - 문장형
   - 시스템 프롬프트형
8. `프롬프트 생성`을 누릅니다.

## 6. 모델이 목록에 안 보일 때

아래 순서로 확인하세요.

1. Ollama가 설치되어 있는지 확인합니다.
2. PowerShell에서 `ollama list`를 실행합니다.
3. 모델이 없다면 `ollama pull llava`를 실행합니다.
4. Local Prompt Studio에서 `Refresh`를 다시 누릅니다.
5. 그래도 안 되면 앱을 껐다가 다시 실행합니다.

## 7. WebP 이미지가 안 될 때

최신 버전은 WebP 이미지를 내부에서 PNG로 변환한 뒤 모델에 보냅니다.

그래도 실패하면 다음을 확인하세요.

- 선택한 모델이 Vision 모델인지 확인
- Ollama에서 모델이 실제로 설치되어 있는지 확인
- 너무 큰 이미지는 줄여서 다시 시도

## 8. 웹사이트 이미지 드래그

브라우저나 웹사이트에 보이는 이미지를 Local Prompt Studio 작업공간으로 바로 드래그할 수 있습니다.

이 경우 앱이 이미지 URL을 읽어 프로젝트 자산 폴더에 복사 저장합니다.

일부 사이트는 이미지 직접 다운로드를 막을 수 있습니다. 그럴 때는 이미지를 PC에 저장한 뒤 파일로 드래그하세요.

## 9. 프로젝트 저장 위치

프로젝트는 아래 폴더에 저장됩니다.

```text
C:\Users\<사용자이름>\AppData\Roaming\local-prompt-studio\projects
```

앱 안의 `폴더 열기` 버튼을 누르면 이 위치를 바로 열 수 있습니다.

기본 설정에서는 이미지 원본 경로만 저장해 용량을 아낍니다. `이미지를 프로젝트에 복사 저장`을 켜면 이미지 파일도 프로젝트 폴더에 복사됩니다. 이 방식은 다른 PC로 옮기기 쉽지만 용량을 더 사용합니다.

## 10. 업데이트와 버전 확인

앱 왼쪽 위에 현재 버전이 표시됩니다.

설치형 앱은 GitHub Releases에서 새 버전을 확인합니다.

새 버전이 있으면 앱이 다운로드하고, 다시 시작해서 설치하라는 안내를 보여줍니다.

개발자 모드인 `npm start`에서는 자동 업데이트가 동작하지 않습니다.
