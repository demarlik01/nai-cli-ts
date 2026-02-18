# nai-cli

📖 [English](./README.md) | 📐 [아키텍처](./docs/ARCHITECTURE-ko.md) | 🎨 [프롬프트 가이드](./docs/PROMPTING-GUIDE-ko.md)

NovelAI 이미지 생성 CLI. 텍스트-이미지 생성, img2img, 인페인팅, 업스케일, 태그 추천을 지원한다.

## 설치

```bash
npm install -g nai-cli
```

또는 소스에서 빌드:

```bash
git clone https://github.com/demarlik01-ai/nai-cli-ts.git
cd nai-cli-ts
npm install
npm run build
```

Node.js 18 이상 필요.

## 설정

NovelAI API 토큰이 필요하다. [NovelAI](https://novelai.net)에서 구독 후 토큰을 발급받는다.

```bash
# 토큰 설정
nai config set-token <your-token>

# 설정 확인 (토큰은 마스킹됨)
nai config show

# 설정 검증
nai config validate
```

`NAI_API_TOKEN` 환경변수로도 토큰을 설정할 수 있다 (설정 파일보다 우선).

### 설정 파일

위치: `~/.config/nai-cli/config.json` (`XDG_CONFIG_HOME` 존중)

```json
{
  "version": 1,
  "apiToken": "pst-...",
  "defaultModel": "nai-diffusion-4-5-curated",
  "defaultSampler": "k_euler_ancestral",
  "defaultOutputDir": "./outputs",
  "requestTimeoutMs": 60000,
  "maxRetries": 3,
  "debug": false
}
```

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `version` | `1` | `1` | 설정 스키마 버전 |
| `apiToken` | string \| null | `null` | NovelAI 베어러 토큰 |
| `defaultModel` | string | `nai-diffusion-4-5-curated` | 기본 모델 ID |
| `defaultSampler` | string | `k_euler_ancestral` | 기본 샘플러 ID |
| `defaultOutputDir` | string | `./outputs` | 기본 출력 디렉토리 |
| `defaultOutputTemplate` | string | — | 기본 출력 파일명 템플릿 |
| `requestTimeoutMs` | number | `60000` | 요청 타임아웃 (ms) |
| `maxRetries` | number | `3` | 최대 재시도 횟수 (0–10) |
| `manifestEnabled` | boolean | — | 개별 생성 시 manifest 로깅 활성화 |
| `debug` | boolean | `false` | 디버그 로깅 활성화 |

## 글로벌 옵션

```
--debug          디버그 로깅 활성화
--config <path>  설정 파일 경로 지정
```

## 커맨드

### `generate` — 텍스트-이미지 생성

텍스트 프롬프트로 이미지를 생성한다.

```bash
nai generate --prompt "1girl, blue hair, school uniform, smile"

nai generate \
  --prompt "1girl, blue hair, school uniform" \
  --negative "bad quality, low res" \
  --model nai-diffusion-4-5-curated \
  --width 832 --height 1216 \
  --steps 28 --scale 5.0 \
  --seed 12345 \
  --out ./my-images/
```

| 옵션 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `--prompt <text>` | ✅ | — | 프롬프트 텍스트 |
| `--negative <text>` | | — | 네거티브 프롬프트 |
| `--model <id>` | | 설정값 | 모델 ID |
| `--sampler <id>` | | 설정값 | 샘플러 ID |
| `--width <number>` | | `1024` | 이미지 너비 (64의 배수) |
| `--height <number>` | | `1024` | 이미지 높이 (64의 배수) |
| `--steps <number>` | | `28` | 샘플링 스텝 수 (1–50) |
| `--scale <number>` | | `5` | CFG 스케일 |
| `--seed <number>` | | 랜덤 | 시드 (0–4294967295) |
| `--out <dir>` | | 설정값 | 출력 디렉토리 |
| `--preset <name>` | | — | 저장된 프리셋 로드 |
| `--prompts <file>` | | — | 프롬프트 파일 (줄 단위) |
| `--models <ids>` | | — | 쉼표 구분 모델 ID (매트릭스 배치) |
| `--samplers <ids>` | | — | 쉼표 구분 샘플러 ID (매트릭스 배치) |
| `--concurrency <n>` | | `1` | 동시 요청 수 |
| `--output-template <tpl>` | | 설정값 | 출력 파일명 템플릿 |
| `--dry-run` | | — | API 호출 없이 검증만 수행 |

`--prompt` 또는 `--prompts` 중 하나는 필수.

#### 배치 생성

프롬프트 파일로 매트릭스 조합 일괄 생성:

```bash
# 2개 모델 × 2개 샘플러 × 프롬프트 파일의 모든 조합 생성
nai generate \
  --prompts prompts.txt \
  --models nai-diffusion-4-5-curated,nai-diffusion-3 \
  --samplers k_euler,k_dpmpp_2m \
  --concurrency 2

# 조합 미리보기 (API 호출 없음)
nai generate --prompts prompts.txt --models a,b --dry-run
```

#### 출력 템플릿

템플릿 변수로 출력 파일명 커스터마이징:

```bash
nai generate --prompt "1girl" --output-template "{date}_{model}_{seed}_{index}.png"
```

사용 가능 변수: `{date}`, `{model}`, `{seed}`, `{index}`, `{prompt}`, `{sampler}`.

### `preset` — 프리셋 관리

생성 옵션을 저장하고 재사용한다.

```bash
# 프리셋 저장
nai preset save my-style --model nai-diffusion-4-5-curated --width 832 --height 1216 --steps 28

# 프리셋 목록
nai preset list

# 프리셋 내용 보기
nai preset show my-style

# 프리셋 삭제
nai preset delete my-style

# 프리셋 사용 (CLI 플래그가 프리셋 값보다 우선)
nai generate --preset my-style --prompt "1girl, blue hair"
```

프리셋은 `~/.config/nai-cli/presets/*.json`에 저장된다.

### `img2img` — 이미지-이미지 변환

입력 이미지와 프롬프트를 기반으로 이미지를 생성한다.

```bash
nai img2img \
  --image input.png \
  --prompt "1girl, blue hair, school uniform" \
  --strength 0.7 \
  --noise 0.1 \
  --out ./outputs/
```

| 옵션 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `--image <path>` | ✅ | — | 입력 이미지 경로 |
| `--prompt <text>` | ✅ | — | 프롬프트 텍스트 |
| `--strength <number>` | ✅ | — | 변환 강도 (0–1) |
| `--noise <number>` | ✅ | — | 노이즈 양 (0–1) |
| `--negative <text>` | | — | 네거티브 프롬프트 |
| `--model <id>` | | 설정값 | 모델 ID |
| `--sampler <id>` | | 설정값 | 샘플러 ID |
| `--width <number>` | | `1024` | 이미지 너비 |
| `--height <number>` | | `1024` | 이미지 높이 |
| `--steps <number>` | | `28` | 샘플링 스텝 수 |
| `--scale <number>` | | `5` | CFG 스케일 |
| `--seed <number>` | | 랜덤 | 시드 |
| `--out <dir>` | | 설정값 | 출력 디렉토리 |

### `inpaint` — 인페인팅

마스크 영역을 다시 그린다.

```bash
nai inpaint \
  --image input.png \
  --mask mask.png \
  --prompt "red eyes" \
  --strength 0.7 \
  --out ./outputs/
```

| 옵션 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `--image <path>` | ✅ | — | 입력 이미지 경로 |
| `--mask <path>` | ✅ | — | 마스크 이미지 경로 |
| `--prompt <text>` | ✅ | — | 프롬프트 텍스트 |
| `--strength <number>` | ✅ | — | 인페인팅 강도 (0–1) |
| `--negative <text>` | | — | 네거티브 프롬프트 |
| `--model <id>` | | 설정값 | 모델 ID |
| `--sampler <id>` | | 설정값 | 샘플러 ID |
| `--width <number>` | | `1024` | 이미지 너비 |
| `--height <number>` | | `1024` | 이미지 높이 |
| `--steps <number>` | | `28` | 샘플링 스텝 수 |
| `--scale <number>` | | `5` | CFG 스케일 |
| `--seed <number>` | | 랜덤 | 시드 |
| `--out <dir>` | | 설정값 | 출력 디렉토리 |

### `upscale` — 업스케일

이미지 해상도를 높인다.

```bash
nai upscale --image input.png --scale 4 --out ./outputs/
```

| 옵션 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `--image <path>` | ✅ | — | 입력 이미지 경로 |
| `--scale <number>` | | `4` | 업스케일 배율 |
| `--out <dir>` | | 설정값 | 출력 디렉토리 |

### `suggest-tags` — 태그 추천

프롬프트에 어울리는 태그를 추천받는다.

```bash
# JSON 출력 (기본)
nai suggest-tags --prompt "1girl, blue hair"

# 테이블 출력 + 일본어 태그
nai suggest-tags --prompt "1girl" --format table --lang jp
```

| 옵션 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `--prompt <text>` | ✅ | — | 프롬프트 텍스트 |
| `--model <id>` | | 설정값 | 모델 ID |
| `--lang <code>` | | — | 태그 언어 (`en` 또는 `jp`) |
| `--format <type>` | | `json` | 출력 형식 (`json` 또는 `table`) |

### `config` — 설정 관리

```bash
nai config set-token <token>   # API 토큰 저장
nai config show                # 설정 확인 (토큰 마스킹)
nai config validate            # 설정 파일 검증
```

## 지원 모델

| 모델 | ID |
|------|-----|
| V4.5 Curated | `nai-diffusion-4-5-curated` |
| V4.5 Full | `nai-diffusion-4-5-full` |
| V4 Full | `nai-diffusion-4-full` |
| V4 Curated | `nai-diffusion-4-curated` |
| V3 | `nai-diffusion-3` |
| V3 Inpainting | `nai-diffusion-3-inpainting` |
| Furry V3 | `nai-diffusion-furry-3` |
| V2 | `nai-diffusion-2` |
| V1 | `nai-diffusion` |
| Safe Diffusion | `safe-diffusion` |

V4/V4.5 모델은 자동으로 V4 프롬프트 구조(`v4_prompt`)를 사용한다.

## 샘플러

`k_euler`, `k_euler_ancestral`, `k_dpmpp_2s_ancestral`, `k_dpmpp_2m`, `k_dpmpp_sde`, `ddim`

## 출력

- 이미지: `<model>-seed-<seed>-img-<n>.png` (또는 커스텀 템플릿)
- 메타데이터: `<model>-seed-<seed>-img-<n>.json`

기본 출력 디렉토리는 `./outputs/` (설정에서 변경 가능).

### Manifest 로깅

배치 실행 시 output 디렉토리에 `manifest.jsonl`이 자동 생성된다. 각 줄에 기록되는 정보:

```json
{"prompt":"...","model":"...","sampler":"...","seed":123,"filename":"out.png","success":true,"timestamp":"2026-02-18T00:00:00.000Z"}
```

개별 생성(non-batch)에서도 manifest에 기록하려면 설정에서 활성화:

```json
{ "manifestEnabled": true }
```

## 라이선스

MIT
