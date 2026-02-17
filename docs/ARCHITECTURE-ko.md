# nai-cli 아키텍처

## 프로젝트 구조
```text
nai-cli/
├── src/
│   ├── cli.ts                      # 엔트리 포인트, commander 설정, 전역 플래그
│   ├── commands/
│   │   ├── generate.ts             # 텍스트-투-이미지 (action=generate)
│   │   ├── img2img.ts              # 이미지-투-이미지 (action=img2img)
│   │   ├── inpaint.ts              # 인페인팅 (action=infill)
│   │   ├── upscale.ts              # /ai/upscale
│   │   ├── suggest-tags.ts         # /ai/generate-image/suggest-tags
│   │   ├── models.ts               # 모델/샘플러 조회
│   │   └── config.ts               # 토큰/기본값 설정
│   ├── core/
│   │   ├── context.ts              # 런타임 컨텍스트 (config + logger + clock)
│   │   ├── errors.ts               # CLI/API 에러 타입 매핑
│   │   ├── output.ts               # 출력 파일명/경로/안전 저장
│   │   └── validate.ts             # zod 스키마 + 교차 필드 검증
│   ├── config/
│   │   ├── paths.ts                # XDG 경로 해석
│   │   ├── schema.ts               # config 인터페이스 + 버전
│   │   └── store.ts                # config.json 로드/저장
│   ├── novelai/
│   │   ├── client.ts               # fetch 래퍼 + 인증 + 재시도
│   │   ├── endpoints.ts            # 엔드포인트 경로 + 폴백
│   │   ├── payload/
│   │   │   ├── generate.ts         # generate/img2img/infill payload 빌더
│   │   │   ├── upscale.ts          # upscale payload 빌더
│   │   │   └── suggest-tags.ts     # suggest-tags payload 빌더
│   │   ├── models.ts               # 모델 ID, 샘플러, 제약조건
│   │   └── response.ts             # zip/json/png 응답 정규화
│   ├── io/
│   │   ├── image.ts                # 파일 로드, mime 감지, base64 헬퍼
│   │   └── zip.ts                  # 생성 결과 zip 해제
│   └── types/
│       ├── api.ts                  # 요청/응답 DTO
│       └── commands.ts             # CLI 옵션 타입
├── docs/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
├── tsconfig.json
└── README.md
```

## 모듈 다이어그램
```text
CLI (commander)
  -> commands/*
    -> core/validate.ts
    -> novelai/payload/*
    -> novelai/client.ts
      -> novelai/endpoints.ts
      -> fetch()
    -> novelai/response.ts
      -> io/zip.ts or io/image.ts
    -> core/output.ts
```

## CLI 명령어 (이미지 중심)

## 1) `generate`

```bash
nai generate \
  --prompt "1girl, cinematic light" \
  --negative "lowres, blurry" \
  --model nai-diffusion-4-5-curated \
  --sampler k_euler_ancestral \
  --width 1024 --height 1024 \
  --steps 28 --scale 5 \
  --seed 12345 \
  --out ./outputs
```

- `POST /ai/generate-image` + `action=generate` 호출.

## 2) `img2img`

```bash
nai img2img \
  --image ./input.png \
  --prompt "masterpiece, detailed background" \
  --strength 0.45 \
  --noise 0.2 \
  --model nai-diffusion-4-5-full
```

- `POST /ai/generate-image` + `action=img2img` 호출.

## 3) `inpaint`

```bash
nai inpaint \
  --image ./base.png \
  --mask ./mask.png \
  --prompt "restore eyes, natural shading" \
  --strength 0.65 \
  --model nai-diffusion-3-inpainting
```

- `POST /ai/generate-image` + `action=infill` 호출.

## 4) `upscale`

```bash
nai upscale \
  --image ./small.png \
  --scale 4 \
  --out ./outputs
```

- `POST /ai/upscale` 호출.

## 5) `suggest-tags`

```bash
nai suggest-tags \
  --model nai-diffusion-4-5-curated \
  --prompt "girl with red jacket"
```

- `POST /ai/generate-image/suggest-tags` 호출.

## 6) `config`

```bash
nai config set-token <TOKEN>
nai config show
nai config validate
```

- 로컬 인증/기본값 관리.

## 설정 관리

경로:

- `~/.config/nai-cli/config.json` (XDG 기준)

예시:

```json
{
  "version": 1,
  "apiToken": "nai_xxx",
  "defaultModel": "nai-diffusion-4-5-curated",
  "defaultSampler": "k_euler_ancestral",
  "defaultOutputDir": "./outputs",
  "requestTimeoutMs": 60000,
  "maxRetries": 3,
  "debug": false
}
```

규칙:

- `apiToken` 없이는 API 호출 불가.
- `version`으로 향후 마이그레이션 처리.
- CLI 플래그가 config 기본값보다 우선.
- CI 환경에서는 `NAI_API_TOKEN` 환경변수 오버라이드 허용.

## 설계 결정

- 함수형 모듈 패턴: 커맨드 핸들러가 순수 payload 빌더와 클라이언트를 조합.
- 도메인 분리: `commands`, `novelai`, `config`, `core`, `io` 모듈을 분리 유지.
- Native `fetch` (Node >= 18): 불필요한 HTTP 의존성 최소화.
- 응답 타입 스니핑: ZIP/PNG/JSON을 단일 출력 계약으로 정규화.
- 데이터 중심 기능 관리: 모델/샘플러/제약값을 `novelai/models.ts`에서 중앙 관리.
- 명시적 검증: 유효하지 않은 조합은 API 호출 전에 차단.
- 안전한 출력 정책: 결정적 파일명 + 메타데이터 저장 + 기본 덮어쓰기 방지.
