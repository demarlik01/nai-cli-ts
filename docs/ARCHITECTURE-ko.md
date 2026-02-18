# nai-cli 아키텍처

## 프로젝트 구조

```text
nai-cli/
├── src/
│   ├── cli.ts                      # 엔트리 포인트, commander 설정, 전역 플래그
│   ├── commands/
│   │   ├── generate.ts             # 텍스트-투-이미지 (배치/동시실행/드라이런 지원)
│   │   ├── img2img.ts              # 이미지-투-이미지 (action=img2img)
│   │   ├── inpaint.ts              # 인페인팅 (action=infill)
│   │   ├── upscale.ts              # /ai/upscale
│   │   ├── suggest-tags.ts         # /ai/generate-image/suggest-tags
│   │   ├── preset.ts               # 프리셋 저장/로드/목록/삭제
│   │   ├── config.ts               # 토큰/기본값 설정
│   │   └── models.ts               # (스텁, 아직 미등록)
│   ├── core/
│   │   ├── context.ts              # 런타임 컨텍스트 (config + logger + clock)
│   │   ├── errors.ts               # CLI/API 에러 타입 계층
│   │   ├── output.ts               # 출력 경로/파일명, JSON 사이드카, 안전 저장
│   │   ├── validate.ts             # zod 스키마 + 교차 필드 검증
│   │   ├── batch.ts                # 프롬프트 파일 로드, 배치 매트릭스, 동시실행 러너
│   │   ├── manifest.ts             # manifest.jsonl 추가 전용 로깅
│   │   └── template.ts             # 출력 파일명 템플릿 엔진
│   ├── config/
│   │   ├── paths.ts                # XDG 경로 해석
│   │   ├── schema.ts               # config 인터페이스 + 기본값 + 버전
│   │   └── store.ts                # config.json 로드/저장/업데이트
│   ├── preset/
│   │   ├── schema.ts               # 프리셋 zod 스키마
│   │   └── store.ts                # 프리셋 JSON 파일 저장/로드/목록/삭제
│   ├── novelai/
│   │   ├── client.ts               # fetch 래퍼 + 인증 + 재시도 + 지수 백오프
│   │   ├── endpoints.ts            # 이중 호스트 엔드포인트 레지스트리 (image + api)
│   │   ├── models.ts               # 모델 ID, 샘플러 ID, 생성 제약조건
│   │   ├── response.ts             # zip/json/png 스니핑 및 정규화
│   │   └── payload/
│   │       ├── generate.ts         # generate/img2img/infill payload 빌더 (V4 프롬프트 지원)
│   │       ├── generate.test.ts    # payload 빌더 단위 테스트
│   │       └── upscale.ts          # upscale payload 빌더
│   ├── io/
│   │   ├── image.ts                # 파일 로드, mime 감지, 크기 파싱, base64 헬퍼
│   │   └── zip.ts                  # 최소 ZIP 추출기 (외부 의존성 없음)
│   └── types/
│       ├── api.ts                  # 요청/응답 DTO (V4 프롬프트 타입, 엔벨로프)
│       └── commands.ts             # 명령어별 CLI 옵션 인터페이스
├── docs/
├── package.json
├── tsconfig.json
└── README.md
```

## 모듈 다이어그램

```text
CLI (commander)
  └─ commands/*
       ├─ core/context.ts          — RuntimeContext 빌드 (config + logger)
       ├─ core/validate.ts         — API 호출 전 파라미터 검증
       ├─ preset/store.ts          — 프리셋 기본값 로드 (--preset 사용 시)
       ├─ core/batch.ts            — 프롬프트 파일 × 모델 × 샘플러 매트릭스 전개
       ├─ novelai/payload/*        — 요청 엔벨로프 빌드
       ├─ novelai/client.ts        — 재시도 포함 HTTP 호출
       │    └─ novelai/endpoints.ts
       ├─ novelai/response.ts      — ZIP/PNG/JSON 응답 정규화
       │    └─ io/zip.ts, io/image.ts
       ├─ core/output.ts           — 이미지 + JSON 사이드카 저장
       │    └─ core/template.ts    — 파일명 템플릿 해석
       └─ core/manifest.ts         — manifest.jsonl에 기록 추가
```

## CLI 명령어

### `nai generate`

텍스트-투-이미지 생성. 단일 및 배치 모드 지원.

```bash
# 단일 생성
nai generate --prompt "1girl" --model nai-diffusion-4-5-curated --out ./outputs

# 프롬프트 파일로 배치 생성
nai generate --prompts prompts.txt --models nai-diffusion-4-5-curated,nai-diffusion-4-5-full \
  --samplers k_euler,k_euler_ancestral --concurrency 3

# 드라이런 (API 호출 없이 검증만)
nai generate --prompt "test" --dry-run

# 프리셋 사용
nai generate --prompt "1girl" --preset my-preset

# 커스텀 출력 템플릿
nai generate --prompt "1girl" --output-template "{date}-{model}-{seed}"
```

주요 기능:
- **배치 매트릭스**: `--prompts` 파일 × `--models` × `--samplers`의 데카르트 곱으로 작업 생성
- **동시실행**: `--concurrency N`으로 최대 N개 API 호출을 병렬 처리
- **드라이런**: `--dry-run`으로 입력 검증 및 계획 출력 (API 호출 없음)
- **프리셋**: `--preset <name>`으로 저장된 파라미터 기본값 로드
- **출력 템플릿**: `--output-template`에서 `{date}`, `{model}`, `{seed}`, `{index}`, `{prompt}`, `{sampler}` 변수 사용
- `POST /ai/generate-image` + `action=generate` 호출

### `nai img2img`

```bash
nai img2img --image ./input.png --prompt "detailed background" --strength 0.45 --noise 0.2
```

`POST /ai/generate-image` + `action=img2img` 호출.

### `nai inpaint`

```bash
nai inpaint --image ./base.png --mask ./mask.png --prompt "restore eyes" --strength 0.65
```

`POST /ai/generate-image` + `action=infill` 호출.

### `nai upscale`

```bash
nai upscale --image ./small.png --scale 4 --out ./outputs
```

`POST /ai/upscale` 호출 (`api.novelai.net`).

### `nai suggest-tags`

```bash
nai suggest-tags --prompt "girl with red jacket" --model nai-diffusion-4-5-curated --format table
```

`GET /ai/generate-image/suggest-tags` 호출 (`image.novelai.net`).

### `nai preset`

```bash
nai preset save my-preset --model nai-diffusion-4-5-curated --width 1024 --height 1024 --steps 28
nai preset show my-preset
nai preset list
nai preset delete my-preset
```

프리셋은 `~/.config/nai-cli/presets/<name>.json`에 개별 JSON 파일로 저장.

### `nai config`

```bash
nai config set-token <TOKEN>
nai config show
nai config validate
```

## 설정

경로: `~/.config/nai-cli/config.json` (XDG 기준)

```json
{
  "version": 1,
  "apiToken": "nai_xxx",
  "defaultModel": "nai-diffusion-4-5-curated",
  "defaultSampler": "k_euler_ancestral",
  "defaultOutputDir": "./outputs",
  "defaultOutputTemplate": "{date}-{model}-{seed}",
  "requestTimeoutMs": 60000,
  "maxRetries": 3,
  "manifestEnabled": true,
  "debug": false
}
```

- CLI 플래그가 config 기본값보다 우선.
- CI 환경에서 `NAI_API_TOKEN` 환경변수 오버라이드 지원.
- `config show`에서 토큰은 마스킹 처리.

## 데이터 흐름

### 단일 생성

```
CLI 인자 + config + 프리셋
  → 검증 (zod)
  → payload 빌드 (v4+ 모델은 V4 프롬프트 객체 자동 생성)
  → POST /ai/generate-image
  → 응답 스니핑 (ZIP → PNG 추출, 또는 raw PNG)
  → 이미지 파일 + JSON 사이드카 메타데이터 저장
  → manifest.jsonl 기록 추가 (활성화 시)
```

### 배치 생성

```
프롬프트 파일 로드 (prompts.txt, 한 줄에 하나, # 주석 무시)
  → 매트릭스 빌드: 프롬프트 × 모델 × 샘플러
  → 배치 요약 출력 (작업 수)
  → 제한된 동시실행으로 작업 실행 (p-limit 방식)
  → 각 작업: 검증 → 생성 → 출력 저장 → 매니페스트 기록
  → 최종 요약 출력 (성공/실패 수)
```

## 출력 파일

각 생성마다 생성되는 파일:
- **이미지**: `<output-dir>/<template>-<index>.png`
- **JSON 사이드카**: `<output-dir>/<template>-<index>.json` (전체 요청 payload + 메타데이터)
- **매니페스트** (조건부): `<output-dir>/manifest.jsonl` (생성당 JSON 한 줄, 추가 전용; 배치 실행 시 또는 config의 `manifestEnabled` 활성화 시 기록)

매니페스트 엔트리 형태:
```json
{"prompt":"...","model":"...","sampler":"...","seed":0,"filename":"...","success":true,"timestamp":"..."}
```

## 프리셋 저장소

프리셋은 `~/.config/nai-cli/presets/<name>.json`에 JSON 파일로 저장:

```json
{
  "name": "landscape",
  "model": "nai-diffusion-4-5-full",
  "width": 1216,
  "height": 832,
  "steps": 28,
  "scale": 5,
  "negative": "lowres, blurry",
  "outputDir": "./landscape-outputs",
  "outputTemplate": "{date}-{model}-{prompt}"
}
```

이름 규칙: 영숫자, 하이픈, 밑줄만 허용.

## 에러 처리

`core/errors.ts`의 타입 에러 계층:

| 에러 클래스 | 코드 | 용도 |
|---|---|---|
| `ConfigError` | `CONFIG_ERROR` | 토큰 누락, 잘못된 설정 |
| `ValidationError` | `VALIDATION_ERROR` | 잘못된 파라미터, 잘못된 크기 |
| `ApiError` | `API_ERROR` | 비-2xx API 응답 |
| `NetworkError` | `NETWORK_ERROR` | fetch 실패, 타임아웃 |
| `IoError` | `IO_ERROR` | 파일 읽기/쓰기 실패 |

모든 에러는 최상위에서 포착되어 `[CODE] message` 형식으로 출력. `--debug` 시 스택 트레이스 표시.

## 설계 결정

- **commander + zod 외 런타임 의존성 제로**: native `fetch`, native `zlib`로 ZIP 처리.
- **파일 기반 저장**: JSON config, JSON 프리셋 파일, JSONL 매니페스트. 데이터베이스 없음.
- **함수형 모듈 패턴**: 커맨드 핸들러가 순수 payload 빌더와 클라이언트 함수를 조합.
- **도메인 격리**: `commands/`, `novelai/`, `config/`, `core/`, `preset/`, `io/` 분리 유지.
- **응답 타입 스니핑**: ZIP/PNG/JSON을 단일 출력 계약으로 정규화.
- **데이터 중심 제약**: 모델/샘플러/해상도 테이블을 `novelai/models.ts`에서 중앙 관리.
- **명시적 검증**: 유효하지 않은 조합은 API 호출 전에 차단.
- **안전한 출력**: 결정적 파일명 + 덮어쓰기 방지.
- **이중 호스트 지원**: 생성은 `image.novelai.net`, 업스케일/분류는 `api.novelai.net`.
- **V4 프롬프트 지원**: v4+ 모델에서 V4 프롬프트 객체 자동 생성.
