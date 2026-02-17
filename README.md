# nai-cli

NovelAI 이미지 생성 CLI. 텍스트 프롬프트로 이미지 생성, img2img, 인페인팅, 업스케일, 태그 추천을 지원한다.

## 설치

```bash
npm install -g nai-cli
```

또는 로컬 빌드:

```bash
git clone https://github.com/demarlik01-ai/nai-cli-ts.git
cd nai-cli-ts
npm install
npm run build
```

## 설정

NovelAI API 토큰이 필요하다. [NovelAI](https://novelai.net) 구독 후 토큰을 발급받는다.

```bash
# 토큰 설정
nai config set-token <your-token>

# 설정 확인
nai config show

# 설정 검증
nai config validate
```

설정 파일 위치: `~/.config/nai-cli/config.json`

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

## 사용법

### 이미지 생성 (txt2img)

```bash
# 기본 생성
nai generate --prompt "1girl, blue hair, school uniform, smile"

# 옵션 지정
nai generate \
  --prompt "1girl, blue hair, school uniform" \
  --negative "bad quality, low res" \
  --model nai-diffusion-4-5-curated \
  --width 832 --height 1216 \
  --steps 28 --scale 5.0 \
  --seed 12345 \
  --out ./my-images/
```

### img2img

입력 이미지를 기반으로 변형 생성.

```bash
nai img2img \
  --image input.png \
  --prompt "1girl, blue hair, school uniform" \
  --strength 0.7 \
  --noise 0.1 \
  --out ./outputs/
```

### 인페인팅

마스크 영역을 다시 그린다.

```bash
nai inpaint \
  --image input.png \
  --mask mask.png \
  --prompt "red eyes" \
  --strength 0.7 \
  --out ./outputs/
```

### 업스케일

이미지 해상도를 높인다.

```bash
nai upscale \
  --image input.png \
  --scale 4 \
  --out ./outputs/
```

### 태그 추천

프롬프트에 어울리는 태그를 추천받는다.

```bash
# 기본 (JSON 출력)
nai suggest-tags --prompt "1girl, blue hair"

# 테이블 출력 + 일본어 태그
nai suggest-tags --prompt "1girl" --format table --lang jp
```

## 지원 모델

| 모델 | ID |
|------|-----|
| V4.5 Curated | `nai-diffusion-4-5-curated` |
| V4.5 Full | `nai-diffusion-4-5-full` |
| V4 Curated | `nai-diffusion-4-curated` |
| V4 Full | `nai-diffusion-4-full` |
| V3 | `nai-diffusion-3` |
| V3 Inpainting | `nai-diffusion-3-inpainting` |
| Furry V3 | `nai-diffusion-furry-3` |

V4/V4.5 모델은 자동으로 V4 프롬프트 구조(`v4_prompt`)를 사용한다.

## 샘플러

`k_euler`, `k_euler_ancestral`, `k_dpmpp_2s_ancestral`, `k_dpmpp_2m`, `k_dpmpp_sde`, `ddim`

## 출력

- 이미지: `<model>-seed-<seed>-img-<n>.png`
- 메타데이터: `<model>-seed-<seed>-img-<n>.json`

기본 출력 디렉토리는 `./outputs/` (config에서 변경 가능).

## 글로벌 옵션

```
--debug          디버그 로깅 활성화
--config <path>  설정 파일 경로 지정
```

## 라이선스

MIT
