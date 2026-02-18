# NovelAI 이미지 프롬프트 가이드

*Last updated: 2026-02-18*

NovelAI 이미지 생성을 위한 종합 프롬프트 가이드입니다. 사람과 AI 에이전트 모두를 위해 작성되었습니다.

> **출처:** 이 가이드는 [NovelAI 공식 문서](https://docs.novelai.net/en/image/), 커뮤니티 리소스, 실험 결과를 종합한 것입니다. 공식 정보는 별도 표시 없이, 커뮤니티 팁은 💡로 표시합니다.

> 💡 **핵심 철학**: 프롬프팅은 레고 블럭을 짜 맞추는 것과 같습니다. 태그를 정확히 조합해야 원하는 결과를 얻을 수 있습니다. 각 태그는 하나의 블럭이고, 조합과 배치가 최종 이미지를 결정합니다.

---

## 목차

1. [모델 개요](#모델-개요)
2. [프롬프트 구조](#프롬프트-구조)
3. [Danbooru 태그 시스템](#danbooru-태그-시스템)
4. [품질 및 미적 태그](#품질-및-미적-태그)
5. [강조와 약화](#강조와-약화)
6. [네거티브 프롬프트 (Undesired Content)](#네거티브-프롬프트-undesired-content)
7. [멀티 캐릭터 프롬프팅](#멀티-캐릭터-프롬프팅)
8. [등급 태그](#등급-태그)
9. [텍스트 렌더링](#텍스트-렌더링)
10. [프롬프트 랜덤마이저](#프롬프트-랜덤마이저)
11. [파라미터 가이드](#파라미터-가이드)
12. [Img2Img, 인페인트 & 캔버스](#img2img-인페인트--캔버스)
13. [후처리](#후처리)
14. [Anlas & 비용 절약 팁](#anlas--비용-절약-팁)
15. [실전 예시](#실전-예시)
16. [nai-cli 연동](#nai-cli-연동)
17. [참고 자료](#참고-자료)

---

## 모델 개요

### 현재 모델

| 모델 ID | 이름 | 설명 |
|---------|------|------|
| `nai-diffusion-4-5-curated` | V4.5 Curated | 최신 모델. 깔끔하고 안전한 데이터셋. 범용 추천. |
| `nai-diffusion-4-5-full` | V4.5 Full | 최신 모델. 더 넓은 데이터셋. Curated로 안 될 때 사용. |
| `nai-diffusion-4-curated` | V4 Curated | 이전 세대. NovelAI 자체 개발 모델. |
| `nai-diffusion-4-full` | V4 Full | 이전 세대, V4 Curated보다 넓은 데이터셋. |
| `nai-diffusion-3` | Anime V3 | SDXL 기반. 태그 순서가 결과에 큰 영향. |
| `nai-diffusion-furry-3` | Furry V3 | 퍼리 특화 V3. Danbooru가 아닌 e621 태그 사용. |

### 핵심 차이점

| 특성 | V3 | V4 / V4.5 |
|------|-----|-----------|
| 기반 | SDXL | 자체 개발 |
| 토크나이저 | CLIP | T5 (대소문자 구분) |
| 프롬프트 한도 | ~225 CLIP 토큰 | ~512 T5 토큰 |
| 태그 순서 | 앞쪽 = 더 강함 | 위치 의존도 낮음 |
| 자연어 이해 | 제한적 | 우수 |
| 멀티 캐릭터 | 미지원 | 최대 6명 |
| 텍스트 렌더링 | 미흡 | 개선됨 (영어) |
| 수치 강조 | 없음 | `1.5::태그::` 문법 |
| 음수 강조 | 없음 | V4.5만: `-1::태그::` |
| 유니코드 | 지원 | 미지원 (T5 제한) |

### Curated vs Full

- **Curated**: 깔끔한 데이터셋, 예측 가능한 결과, 방송용으로 안전. 니치한 개념에는 약할 수 있음.
- **Full**: 더 넓은 데이터셋, 특수한 개념 처리 가능. 예상치 못한 결과가 나올 수 있음.

### 특수 데이터셋 태그 (V4+)

프롬프트 **맨 앞에** 배치하여 생성 모드를 전환합니다:

- **`fur dataset,`** — 퍼리/케모노 스타일 활성화. V4.5 Full과 함께 사용 권장.
- **`background dataset,`** (V4.5+) — 인물 없이 풍경, 정물, 동물 사진을 포토그래픽 스타일로 생성.

---

## 프롬프트 구조

### 권장 태그 순서

💡 **커뮤니티 권장 태그 순서**:

1. **인물 수/종류**: `1girl`, `2boys`, `1other`
2. **캐릭터 & 시리즈**: `hatsune miku`, `genshin impact`
3. **작가 태그**: `wlop`, `kuvshinov ilya` (화풍 제어)
4. **품질/미학 태그**: `very aesthetic`, `masterpiece`
5. **아트 스타일 & 매체**: `watercolor (medium)`, `year 2024`
6. **구도 & 카메라 앵글**: `cowboy shot`, `from above`, `dutch angle`
7. **배경 & 장소**: `outdoors`, `classroom`, `cityscape`
8. **인물 외형**: 머리카락, 눈, 체형
9. **의상 & 소품**: 구체적인 의류 태그
10. **자세 & 표정**: `smile`, `arms up`, `sitting`
11. **기타 디테일**: 소도구, 이펙트, 분위기

> V3에서는 순서가 매우 중요합니다 (앞쪽 = 강한 영향). V4/V4.5에서는 덜 중요하지만 일관성을 위해 권장합니다.

### 자연어 vs 태그

V4/V4.5는 자연어를 잘 이해합니다. 태그와 문장을 섞어 쓸 수 있습니다:

```
1girl, long silver hair, red eyes, elegant black dress,
She is standing on a balcony overlooking a moonlit city.
very aesthetic, masterpiece
```

💡 **커뮤니티 팁**: 구체적인 시각 요소에는 태그가 더 정확하고 신뢰할 수 있습니다. 자연어는 장면 묘사나 관계 설명에 활용하세요.

### UI 팁: 태그 추천 버블

💡 NovelAI 웹 UI에서 태그 자동완성은 버블 형태로 표시됩니다. **각 버블의 투명도가 AI의 해당 태그 이해도를 나타냅니다** — 불투명할수록 AI가 잘 이해하는 태그입니다. 태그 선택 시 참고하세요.

---

## Danbooru 태그 시스템

NovelAI의 애니메이션 모델은 [Danbooru](https://danbooru.donmai.us/) 태그 시스템으로 학습되었습니다. 정확한 Danbooru 태그를 사용하면 결과가 크게 향상됩니다.

### 태그 형식

- 소문자, 언더스코어 구분 (프롬프트에서는 쉼표로 구분): `long_hair` → `long hair`로 입력
- NovelAI 프롬프트 창에서 자동 완성 제안과 인지도 표시
- V4+는 T5 토크나이저 사용: **대소문자를 구분합니다**. Danbooru 태그는 소문자로 입력.

### 주요 태그 카테고리

| 카테고리 | 예시 | 참고 |
|----------|------|------|
| **캐릭터** | `hatsune miku`, `saber (fate)` | 정확한 Danbooru 태그명 사용 |
| **시리즈/저작권** | `fate/grand order`, `genshin impact` | 캐릭터 인식에 도움 |
| **아티스트** | `wlop`, `kuvshinov ilya` | 화풍에 강한 영향 |
| **머리카락** | `blonde hair`, `long hair`, `twintails`, `hair ribbon` | 색 + 길이 + 스타일 조합 |
| **눈** | `blue eyes`, `heterochromia`, `closed eyes` | |
| **표정** | `smile`, `blush`, `crying`, `open mouth` | |
| **의상** | `school uniform`, `armor`, `sundress`, `hoodie` | 구체적일수록 좋음 |
| **포즈/동작** | `sitting`, `running`, `arms behind back`, `peace sign` | |
| **구도** | `close-up`, `portrait`, `upper body`, `cowboy shot`, `full body` | 잘림/줌 수준 결정 |
| **카메라 앵글** | `from above`, `from below`, `from side`, `dutch angle`, `pov` | 카메라 시점 |
| **배경** | `outdoors`, `classroom`, `starry sky`, `simple background` | |
| **장소(Location)** | `cafe`, `library`, `train station`, `rooftop` | 실내/실외를 특정하지 않고 장소를 유도 |
| **매체** | `watercolor (medium)`, `oil painting (medium)`, `sketch`, `lineart` | 화법/기법 |
| **오브젝트 포커스** | `weapon focus`, `food focus`, `flower focus` | 캐릭터가 아닌 특정 사물에 초점 |
| **등급** | `rating:general`, `rating:sensitive`, `rating:questionable`, `rating:explicit` | 콘텐츠 등급 제어 |

### 캐릭터 이름

**정확한 Danbooru 태그명**을 사용하세요:
- ✅ `yorha no. 2 type b` (Danbooru 태그)
- ❌ `2b` (통칭, 잘 안 먹힘)
- ✅ `hatsune miku`
- ✅ `artoria pendragon (fate)`

💡 **커뮤니티 팁**: [Danbooru](https://danbooru.donmai.us/tags?search%5Border%5D=count)에서 캐릭터를 검색해 정확한 태그명을 확인하세요.

### 아티스트 태그로 스타일 일관성 유지

💡 **커뮤니티 팁**: 아티스트 태그는 여러 이미지의 화풍을 일관되게 유지하는 가장 확실한 방법입니다:

- `wlop` — 반실사, 회화적
- `kuvshinov ilya` — 깔끔한 애니메이션 스타일
- `makoto shinkai` — 배경 풍경에 강함
- `greg rutkowski` — 판타지/회화적

V3에서는 아티스트 태그를 프롬프트 앞쪽에 배치하면 더 강한 효과.

---

## 품질 및 미적 태그

생성 이미지의 전반적 품질과 스타일을 제어하는 특수 태그입니다.

### 품질 태그

| 태그 | 효과 |
|------|------|
| `best quality` | 최고 품질 |
| `amazing quality` | 매우 높은 품질 |
| `great quality` | 좋은 품질 |
| `normal quality` | 일반 |
| `bad quality` | 낮은 품질 (네거티브에 사용) |
| `worst quality` | 최저 품질 (네거티브에 사용) |

### 미적 태그

| 태그 | 모델 | 효과 |
|------|------|------|
| `masterpiece` | V4.5 전용 | 최상위 미적 품질 |
| `top aesthetic` | V4 전용 | 최상위 미적 품질 |
| `very aesthetic` | 전 모델 | 높은 미적 품질 |
| `aesthetic` | 전 모델 | 좋은 미적 품질 |
| `displeasing` | 전 모델 | 낮은 미적 (네거티브에) |
| `very displeasing` | 전 모델 | 최저 미적 (네거티브에) |

### 연도 태그

`year XXXX` — 해당 연도의 주류 화풍을 반영합니다.

```
year 2024    → 모던하고 깔끔한 애니 스타일
year 2010    → 중기 애니 스타일
year 2000    → 클래식 애니 미학
```

### 자동 품질 태그 (기본 프리앰블)

NovelAI는 "품질 태그 추가" 활성화 시 자동으로 태그를 추가합니다:

| 모델 | 자동 추가 태그 |
|------|---------------|
| V4.5 Full | `, location, very aesthetic, masterpiece, no text` |
| V4.5 Curated | `, location, masterpiece, no text, -0.8::feet::, rating:general` |
| V4 Full | `, no text, best quality, very aesthetic, absurdres` |
| V4 Curated | `, rating:general, amazing quality, very aesthetic, absurdres` |
| V3 | `, best quality, amazing quality, very aesthetic, absurdres` |

> **nai-cli 참고**: CLI는 품질 태그를 자동 추가하지 않습니다. 프롬프트에 직접 포함하거나 프리셋에 저장하세요.

---

## 강조와 약화

### 괄호 문법 (전 모델)

- `{태그}` — ×1.05 강화
- `[태그]` — ÷1.05 약화
- 중첩 시 곱셈: `{{태그}}` = ×1.1025, `{{{태그}}}` = ×1.1576

```
1girl, {blue eyes}, [[short hair]], {{{dramatic lighting}}}
```

### 수치 강조 (V4+ 전용)

`가중치::태그::` 문법으로 정밀 제어:

```
1girl, 1.5::rain, night::, 0.5::coat::, black shoes
```

- `1.5::텍스트::` — 1.5배 강조
- `0.5::텍스트::` — 0.5배로 약화
- 여러 태그를 묶을 수 있음: `1.5::rain, night::`
- `::`는 열린 괄호도 닫아줌

> ⚠️ **주의**: 태그가 숫자로 끝나는 경우, `::` 앞에 **공백을 추가**해야 파싱 에러를 방지할 수 있습니다:
> `2::artist:jp06 ::` (`::`  앞 공백에 주목)

### 음수 강조 (V4.5+ 전용)

음수 가중치는 **정밀 핀셋** 역할을 합니다 — 네거티브 프롬프트가 넓게 개념을 회피하는 것과 달리, 음수 강조는 적극적으로 *반대 방향*으로 이미지를 유도합니다:

```
-1::hat::           → 캐릭터의 기본 모자 제거
-1::monochrome::    → 흑백 이미지에 색상 강제 (색을 되살림)
-2::flat color::    → 더 많은 디테일/음영 추가
-1.5::simple background::  → 복잡하고 상세한 배경 유도
```

**음수 강조 vs Undesired Content 사용 시기:**
- **음수 강조**: 특정 개념의 타깃 제거/반전에 효과적인 정밀 도구. 반대 방향으로 적극 유도.
- **Undesired Content**: 일반적으로 피할 것들의 긴 목록에 적합한 넓은 필터. 반대 방향으로 적극 유도하지는 않음.

---

## 네거티브 프롬프트 (Undesired Content)

네거티브 프롬프트(NovelAI에서는 "Undesired Content")는 AI가 피해야 할 것을 지정합니다.

### 공식 프리셋

#### V4.5 Full — Heavy (추천)

```
lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page
```

#### V4.5 Full — Light

```
lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page
```

#### V4.5 Full — Human Focus

```
lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy
```

#### V4.5 Curated — Heavy (추천)

```
blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page
```

#### V4 Full — Heavy

```
blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks
```

#### V3 — Heavy

```
lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]
```

### 커스텀 네거티브 프롬프트 팁

💡 **커뮤니티 팁**:
- 캐릭터 중심 이미지에 `bad anatomy, bad hands` 추가
- 손 퀄리티 개선: `extra fingers, missing fingers, extra digits, fewer digits`
- V3에서 `{bad}`(강조)은 학습된 범용 태그
- `tattoo`를 네거티브에 추가하면 주근깨 아티팩트가 해결되기도 함 (공식 팁)
- Undesired Content에서 `{태그}`는 *더 강하게 회피*, `[태그]`는 *덜 회피*

---

## 멀티 캐릭터 프롬프팅

V4+ 모델에서 사용 가능. 최대 6명까지 지원.

### 문법

`|`로 기본 프롬프트와 캐릭터 프롬프트를 구분:

```
기본 프롬프트 | 캐릭터1 프롬프트 | 캐릭터2 프롬프트
```

### 규칙

1. **인원수 태그**(`2girls`, `1boy`)는 **기본 프롬프트**에
2. 각 캐릭터 프롬프트에는 `girl`, `boy`, `other` (숫자 없이)
3. 캐릭터는 나열 순서대로 왼쪽에서 오른쪽으로 배치

### 상호작용 태그

액션 태그 앞에 `source#`, `target#`, `mutual#` 접두사:

```
2girls, indoors, café | girl, blonde hair, source#hug | girl, black hair, target#hug
```

- `source#동작` — 이 캐릭터가 **행동 주체** (동작을 하는 쪽)
- `target#동작` — 이 캐릭터가 **행동 대상** (동작을 받는 쪽)
- `mutual#동작` — 양쪽이 **함께** 동작을 수행

### 위치 제어

💡 NovelAI 웹 UI는 각 캐릭터의 위치를 지정할 수 있는 **5×5 그리드**를 제공합니다. UI 기능(API/CLI에서는 직접 사용 불가)이지만, 캐릭터 배치를 제어하는 데 유용합니다. 기본적으로 프롬프트 순서에 따라 왼쪽→오른쪽으로 배치됩니다.

### 예시

```
2girls, indoors, factory, night, fog, aesthetic, best quality |
girl, purple eyes, short hair, smile, blonde hair, red blouse, pleated skirt, cowboy shot |
girl, very long hair, purple hair, white jeans, green eyes, turtleneck sweater, cowboy shot
```

---

## 등급 태그

Danbooru 스타일 등급 태그로 생성 이미지의 콘텐츠 등급을 제어합니다:

| 태그 | 설명 |
|------|------|
| `rating:general` | 모든 연령 적합. 선정적 요소 없음. |
| `rating:sensitive` | 약간 선정적이지만 노출 없음. |
| `rating:questionable` | 선정적 콘텐츠, 부분 노출 가능. |
| `rating:explicit` | 성인용 콘텐츠. |

> **참고**: V4.5 Curated는 품질 태그 활성화 시 자동으로 `rating:general`을 추가합니다. 다른 등급을 원하면 명시적으로 지정하세요.

---

## 텍스트 렌더링

V4/V4.5 모델은 이미지 안에 영어 텍스트를 렌더링할 수 있습니다.

### 사용법

1. 프롬프트에 `text` 또는 `english text` 태그를 포함
2. 프롬프트 **맨 끝에** 원하는 텍스트를 추가: `Text: 원하는 문장`

```
1girl, holding sign, smile, english text, very aesthetic, masterpiece, Text: Hello World!
```

### 문제 해결

- **짧은 텍스트가 안 나올 때:** 자동 품질 태그에 `no text`가 포함되어 텍스트 렌더링을 억제할 수 있습니다. 텍스트가 포함된 이미지를 생성할 때는 "품질 태그 추가"를 끄거나, 프리앰블에서 `no text`를 제거하세요.
- 텍스트 렌더링은 영어가 가장 잘 됩니다. 다른 언어는 불안정합니다.
- 짧은 텍스트(1~3 단어)가 긴 문장보다 안정적으로 렌더링됩니다.

---

## 프롬프트 랜덤마이저

NovelAI는 프롬프트 내 인라인 랜덤 선택을 지원합니다:

### 문법

```
||옵션1|옵션2|옵션3||
```

생성할 때마다 목록에서 하나를 랜덤으로 선택합니다.

### 예시

```
1girl, ||blonde hair|red hair|blue hair||, ||smile|serious|blush||, school uniform, very aesthetic
```

> ⚠️ **주의**: 랜덤 선택은 Seed를 고정해도 매번 바뀝니다. 랜덤마이저는 Seed 값과 독립적으로 동작합니다.

---

## 파라미터 가이드

### Steps (스텝)

| 값 | 용도 |
|----|------|
| 1–10 | 빠른 미리보기 / 구도 확인 |
| 20–28 | 표준 생성 (추천) |
| 28 | Opus 무료 한도 |
| 29–50 | 수확 체감; 오히려 역효과 가능 |

> **팁**: 낮은 스텝으로 좋은 구도를 찾은 후 Enhance로 정제하세요.

### Prompt Guidance (CFG Scale)

| 값 | 효과 |
|----|------|
| 1–3 | 매우 자유로운 해석, 부드럽고 회화적 |
| 4–6 | **추천 범위 (V3+)**. 프롬프트 충실도와 품질의 균형 |
| 5–6 | 대부분의 생성에 최적 |
| 7–10 | 프롬프트 충실도 증가, 디테일/선명도 증가 |
| 10+ | 과포화, 아티팩트 위험. Decrisper 사용 권장 |

- **Decrisper** (토글): 높은 가이던스에서 색상/시각적 아티팩트 완화.
- **Prompt Guidance Rescale** (V3): 높은 가이던스의 색상 과포화 완화.

💡 **미세 조절 팁**: Seed를 고정한 후 Guidance를 **0.1 단위로 조절**하면 디테일을 세밀하게 조정할 수 있습니다. 작은 변화(예: 5.0 → 5.1 → 5.2)로도 구도는 유지하면서 디테일 수준이 눈에 띄게 달라집니다.

### 샘플러

| 샘플러 | 비고 |
|--------|------|
| `k_euler_ancestral` | **추천**. 일관되고 고품질. |
| `k_dpmpp_2m` | **추천**. 일관되고 고품질. |
| `k_euler` | 표준 Euler. 결정적. |
| `k_dpmpp_2s_ancestral` | Ancestral 변형. 더 다양한 변화. |
| `k_dpmpp_sde` | SDE 변형. 다른 미감. |
| `ddim` | 구형 샘플러. SMEA 미지원. |

#### SMEA & SMEA DYN

- **SMEA**: 고해상도에서 일관성 향상. 약간 부드러운 느낌. Anlas 추가 소비.
- **SMEA DYN**: SMEA보다 덜 부드럽고 고해상도 아티팩트만 줄여줌.
- **Auto SMEA**: 1024×1024 이상에서 자동 적용.
- 고해상도에서 캐릭터 중복, 해부학적 왜곡 방지.

### 해상도

일반적인 해상도 (64의 배수여야 함):

| 비율 | 세로 | 가로 | 용도 |
|------|------|------|------|
| 1:1 | 1024×1024 | — | 정방형 구도 |
| 2:3 | 832×1216 | 1216×832 | **기본 세로/가로** |
| 9:16 | 768×1344 | 1344×768 | 폰 배경화면 |
| 3:4 | 896×1152 | 1152×896 | 표준 사진 비율 |

---

## Img2Img, 인페인트 & 캔버스

### Img2Img

기존 이미지를 프롬프트로 변환합니다. 핵심 파라미터:

- **Strength**: 원본을 얼마나 바꿀지 (0.0 = 변경 없음, 1.0 = 완전 재생성). 0.5~0.7 정도로 시작 권장.
- **Noise**: 생성 전 추가되는 노이즈. 높을수록 더 많은 변화.

### 인페인팅

마스크로 이미지의 특정 부분만 선택적으로 재생성합니다. 손, 얼굴 수정이나 요소 추가/제거에 유용합니다.

### 캔버스 & 아웃페인팅

캔버스 기능으로 이미지를 원래 경계 너머로 확장할 수 있습니다:

1. 캔버스에 이미지를 배치
2. 확장할 방향으로 빈 공간을 만들기
3. 빈 공간에 인페인트를 적용하여 원본과 어울리는 새 콘텐츠 생성

### 바이브 트랜스퍼 (Vibe Transfer)

참조 이미지로 새 생성의 스타일/콘텐츠에 영향을 줍니다:

- **Reference Strength**: 참조 이미지의 영향력 (높을수록 더 유사)
- **Information Extracted**: 참조에서 추출할 정보 — 낮은 값은 넓은 스타일/색감, 높은 값은 구체적 디테일과 구도까지 추출

---

## 후처리

### Enhance (인핸스)

프롬프트 기반의 디테일 향상. 기존 생성물에 프롬프트를 따라 디테일과 정밀도를 추가합니다. 품질 향상과 함께 업스케일링에도 좋습니다.

### Upscale (업스케일)

프롬프트 없이 4배 해상도 확대. 원본 이미지를 충실하게 고해상도로 변환합니다.

### Director Tools (디렉터 도구)

특수 목적의 타깃 편집 도구:

- **Remove Background**: 배경 제거, 피사체 분리
- **Colorize**: 흑백/스케치에 색 입히기
- **Emotion**: 기존 이미지의 표정 변경

---

## Anlas & 비용 절약 팁

### Opus 구독자 무료 생성

Opus 구독자는 **아래 조건을 모두 충족**하면 무료로 생성할 수 있습니다:
- 해상도 ≤ Normal 사이즈 (예: 832×1216)
- Steps ≤ 28
- 1장 생성 (배치 사이즈 = 1)
- SMEA 미사용 (Auto SMEA 제외)

### Anlas 절약하기

- 구도 확인은 낮은 스텝(5~10)으로, 마음에 드는 결과를 Enhance로 정제
- 가능하면 무료 생성 범위 안에서 작업
- 높은 스텝으로 재생성하기보다 Enhance 활용

---

## 실전 예시

### 고품질 인물 (V4.5)

```bash
nai generate \
  --model nai-diffusion-4-5-curated \
  --prompt "1girl, long silver hair, blue eyes, gentle smile, white sundress, flower crown, standing in a sunflower field, golden hour, wind blowing hair, very aesthetic, masterpiece" \
  --negative "lowres, artistic error, worst quality, bad quality, jpeg artifacts, very displeasing, bad anatomy" \
  --width 832 --height 1216 \
  --steps 28 --scale 5
```

### 다이나믹 액션씬

```bash
nai generate \
  --prompt "1boy, spiky black hair, red eyes, black coat, dual wielding swords, dynamic pose, battle stance, sparks, dark castle interior, dramatic lighting, rain, very aesthetic, masterpiece" \
  --negative "lowres, artistic error, worst quality, bad quality, jpeg artifacts, very displeasing, multiple views, bad anatomy" \
  --width 1216 --height 832 \
  --steps 28 --scale 6
```

### 풍경 / 배경 (V4.5)

```bash
nai generate \
  --prompt "background dataset, mountain lake at sunset, snow-capped peaks, reflection in water, pine forest, dramatic clouds, golden light, very aesthetic, masterpiece" \
  --negative "lowres, worst quality, bad quality, jpeg artifacts, very displeasing, text, watermark" \
  --width 1216 --height 832 \
  --steps 28 --scale 5
```

### 두 캐릭터 상호작용 (V4.5)

```bash
nai generate \
  --prompt "2girls, outdoors, cherry blossom, spring, park bench, very aesthetic, masterpiece | girl, long black hair, red eyes, school uniform, smile, sitting, source#pointing at another | girl, short blonde hair, green eyes, casual clothes, standing, target#pointing, blush" \
  --negative "lowres, artistic error, worst quality, bad quality, very displeasing, bad anatomy" \
  --width 1216 --height 832 \
  --steps 28 --scale 5
```

### 특정 화풍 + 연도 태그

```bash
nai generate \
  --prompt "1girl, red hair, ponytail, green eyes, miko outfit, holding broom, shrine, autumn leaves, year 2020, very aesthetic, masterpiece" \
  --negative "lowres, worst quality, bad quality, very displeasing" \
  --width 832 --height 1216 \
  --steps 28 --scale 5
```

### 퍼리 모드 (V4.5)

```bash
nai generate \
  --model nai-diffusion-4-5-full \
  --prompt "fur dataset, 1other, anthro fox, orange fur, blue eyes, adventurer outfit, leather armor, forest path, sunlight through trees, very aesthetic, masterpiece" \
  --negative "lowres, worst quality, bad quality, very displeasing" \
  --width 832 --height 1216 \
  --steps 28 --scale 5
```

### 텍스트 포함 이미지 (V4.5)

```bash
nai generate \
  --prompt "1girl, holding sign, smile, park, english text, very aesthetic, masterpiece, Text: Welcome!" \
  --negative "lowres, worst quality, bad quality, very displeasing" \
  --width 832 --height 1216 \
  --steps 28 --scale 5
```

---

## nai-cli 연동

### 재사용 가능한 프리셋 저장

반복되는 설정을 프리셋으로 저장:

```bash
# 고품질 인물 프리셋
nai preset save hq-portrait \
  --model nai-diffusion-4-5-curated \
  --width 832 --height 1216 \
  --steps 28 --scale 5

# 프롬프트만 지정해서 생성
nai generate --preset hq-portrait \
  --prompt "1girl, blue hair, school uniform, smile, very aesthetic, masterpiece" \
  --negative "lowres, worst quality, bad quality, very displeasing, bad anatomy"
```

### 네거티브 프롬프트 포함 프리셋

```bash
nai preset save safe-defaults \
  --model nai-diffusion-4-5-curated \
  --width 832 --height 1216 \
  --steps 28 --scale 5 \
  --negative "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, bad anatomy, multiple views"
```

### 프롬프트 파일로 배치 생성

`prompts.txt` 작성:
```
1girl, long red hair, green eyes, witch hat, holding staff, forest, very aesthetic, masterpiece
1boy, silver armor, knight, castle courtyard, sunset, very aesthetic, masterpiece
1girl, blue kimono, cherry blossom, shrine, spring, very aesthetic, masterpiece
```

```bash
nai generate --preset hq-portrait --prompts prompts.txt --concurrency 2
```

### 모델 비교 매트릭스

모델 간 결과 비교:

```bash
nai generate \
  --prompt "1girl, long hair, school uniform, classroom, very aesthetic" \
  --negative "lowres, worst quality" \
  --models nai-diffusion-4-5-curated,nai-diffusion-4-5-full,nai-diffusion-3 \
  --width 832 --height 1216 \
  --steps 28 --scale 5
```

### 드라이런으로 사전 검증

```bash
nai generate --preset hq-portrait --prompt "test prompt" --dry-run
```

---

## 참고 자료

### 공식
- [NovelAI 문서 — 이미지 생성](https://docs.novelai.net/en/image/)
- [태그 가이드](https://docs.novelai.net/en/image/tags/)
- [강조 & 약화](https://docs.novelai.net/en/image/strengthening-weakening/)
- [멀티 캐릭터 프롬프팅](https://docs.novelai.net/en/image/multiplecharacters/)
- [샘플링 방법](https://docs.novelai.net/en/image/sampling/)
- [Undesired Content 프리셋](https://docs.novelai.net/en/image/undesiredcontent/)

### 커뮤니티
- [nax.moe](https://nax.moe/) — NovelAI 태그 실험 갤러리. 개별 태그가 결과에 미치는 영향을 통제된 비교로 보여줌.
- [Danbooru 태그 검색](https://danbooru.donmai.us/tags) — 정확한 태그명과 인기도 확인
- [Reddit r/NovelAi](https://www.reddit.com/r/NovelAi/) — 커뮤니티 토론 및 가이드

### AI 에이전트용 빠른 참조

프로그래밍적으로 프롬프트를 구성할 때:

```
MODEL:    nai-diffusion-4-5-curated (안전) 또는 nai-diffusion-4-5-full (다목적)
SIZE:     832×1216 (세로) 또는 1216×832 (가로) 또는 1024×1024 (정방형)
STEPS:    28
SCALE:    5.0
SAMPLER:  k_euler_ancestral

프롬프트 템플릿:
  [인원수], [캐릭터 상세], [포즈/동작], [배경], [품질 태그]

품질 접미사:
  very aesthetic, masterpiece

네거티브 템플릿:
  lowres, artistic error, worst quality, bad quality, jpeg artifacts, very displeasing, bad anatomy
```
