# NovelAI Image API Analysis

Date: 2026-02-17
Scope: NovelAI image-generation API surface needed for `nai-cli`

## Sources and Confidence

Because `https://image.novelai.net/docs/index.html#/` is Swagger UI (JS-rendered), this analysis combines:

- Official user docs (`docs.novelai.net`) for features and parameter behavior.
- Swagger-adjacent mirror docs for endpoint and schema-level details.
- Active community SDK/source code for payload and response handling.

Confidence labels used below:

- `Official`: Confirmed in NovelAI first-party docs.
- `Mirror`: From Swagger-like mirror docs of the image API.
- `Community`: Derived from active SDK implementations and unofficial docs.
- `Inferred`: Cross-source inference, not explicitly guaranteed by NovelAI.

## 1. Authentication

## 1.1 Method

- Image API calls use `Authorization: Bearer <token>`. (`Mirror`, `Community`)
- Base image host is `https://image.novelai.net`. (`Mirror`, `Community`)

## 1.2 Token Acquisition

- Community clients authenticate against account endpoints (for example, `POST /user/login` on NovelAI account API) and then reuse the returned token for image calls. (`Community`)
- For `nai-cli`, safest approach is to accept a user-provided API token first, then optionally add login-helper flow later. (`Inferred`)

## 1.3 Recommended CLI Contract

- Store token in `~/.config/nai-cli/config.json`.
- Never print token in normal logs.
- Redact token in debug/error output.

## 2. Image-Related Endpoints

The following endpoints were found across mirror docs and active SDKs.

| Method | Path | Purpose | Confidence |
|---|---|---|---|
| POST | `/ai/generate-image` | Text-to-image, img2img, inpaint/infill, and related generation actions | `Mirror` + `Community` |
| POST | `/ai/generate-image/suggest-tags` | Prompt/tag suggestion from text seed | `Mirror` + `Community` |
| POST | `/ai/upscale` | Upscale an existing image | `Mirror` + `Community` |
| POST | `/ai/augment-image` | Image augmentation pipelines (emotion/line-art/debackground style operations depending on `req_type`) | `Community` |
| POST | `/ai/annotate-image` | Image annotation/caption/tags | `Community` |
| POST | `/ai/classify-image` or `/ai/classify` | Image classification endpoint name differs by source | `Mirror` + `Community` |
| POST | `/ai/generate-prompt` | Prompt generation helper | `Community` |

### 2.1 `POST /ai/generate-image`

Primary endpoint for generation.

Request patterns seen:

- `multipart/form-data` with:
  - `input`: JSON string containing `{ model, action, parameters }`
  - optional binary file parts for source/mask depending on action (`Community`)
- JSON body variant where source image/mask are base64 fields inside `parameters` (`Community`)

Core request envelope:

```json
{
  "model": "nai-diffusion-4-5-curated",
  "action": "generate",
  "parameters": {
    "width": 1024,
    "height": 1024,
    "steps": 28,
    "scale": 5,
    "sampler": "k_euler_ancestral",
    "seed": 123456789,
    "n_samples": 1,
    "prompt": "1girl, cinematic lighting",
    "negative_prompt": "lowres, blurry"
  }
}
```

Observed `action` values (`Community`):

- `generate`
- `img2img`
- `infill`
- `colorize`
- `emotion`
- `lineart`

Response:

- Typically `application/zip` containing one or more PNG files and metadata text/json sidecar entries. (`Community`, `Mirror`, old unofficial docs)

### 2.2 `POST /ai/generate-image/suggest-tags`

Purpose:

- Suggest prompt tags for a chosen model.

Common request:

```json
{
  "model": "nai-diffusion-4-5-curated",
  "prompt": "1girl in a red jacket"
}
```

Common response shape (`Community`):

```json
{
  "model": "nai-diffusion-4-5-curated",
  "tags": [
    { "tag": "red jacket", "confidence": 0.94 }
  ]
}
```

### 2.3 `POST /ai/upscale`

Purpose:

- Upscale input image by `scale` (and in some docs width/height constraints).

Request pattern:

- multipart with image file and scalar params (commonly `scale`). (`Mirror`, `Community`)

Response:

- Usually single image bytes (`image/png` / octet-stream depending on server). (`Community`)

### 2.4 `POST /ai/augment-image`

Purpose:

- Auxiliary image transforms; observed fields include:
  - `req_type`
  - `image`
  - `width`, `height`
  - `defry`
  - `prompt`
  - `emotion`
  - `seed`

This endpoint is not well documented in official user docs; behavior appears mode-dependent. (`Community`)

### 2.5 `POST /ai/annotate-image`

Purpose:

- Image annotation/tagging/caption helper from uploaded image. (`Community`)

### 2.6 `POST /ai/classify-image` vs `POST /ai/classify`

Observed inconsistency:

- Some docs/clients use `/ai/classify-image`.
- Some active wrappers call `/ai/classify`.

Treat as compatibility risk and implement fallback routing. (`Mirror` + `Community`)

### 2.7 `POST /ai/generate-prompt`

Purpose:

- Prompt-assist helper endpoint seen in SDKs. (`Community`)

## 3. Parameter Surface

## 3.1 Models

Official UI-facing model families (`Official`):

- Anime v4.5 Curated
- Anime v4.5 Full
- Anime v4
- Anime v3
- Furry v3
- Anime v2
- Anime v1
- Furry
- Inpainting models

Community-observed API model IDs (`Community`):

- `safe-diffusion`
- `nai-diffusion`
- `nai-diffusion-2`
- `nai-diffusion-3`
- `nai-diffusion-furry`
- `nai-diffusion-furry-3`
- `nai-diffusion-3-inpainting`
- `nai-diffusion-4-full`
- `nai-diffusion-4-curated`
- `nai-diffusion-4-5-full`
- `nai-diffusion-4-5-curated`

## 3.2 Samplers

Officially listed options include (`Official`):

- `k_euler` (Euler)
- `k_euler_ancestral` (Euler Ancestral; commonly recommended default)
- `k_dpmpp_2s_ancestral` (DPM++ 2S Ancestral)
- `k_dpmpp_2m` (DPM++ 2M)
- `k_dpmpp_sde` (DPM++ SDE)
- `ddim`

Community clients expose additional variants (`Community`):

- `k_dpmpp_2m_sde`
- `k_dpmpp_2m_sde_gpu`
- `k_dpmpp_3m_sde`
- `k_dpmpp_3m_sde_gpu`
- `k_lms`
- `nai_smea`
- `nai_smea_dyn`

## 3.3 Size and Resolution Rules

From official image settings docs (`Official`):

- Width and height should be multiples of 64.
- For V4.5 models: max width/height documented as `4096x4096`.
- For older models: max total pixel count documented as `28,311,552`.

Community preset size buckets (`Community`):

- 512x768
- 832x1216
- 1024x1024
- 1216x832
- 1472x704

## 3.4 Common Generation Parameters

Common fields across official docs and SDKs:

- `prompt` / negative prompt (`uc` alias appears in some clients)
- `seed`
- `steps`
- `scale` (CFG)
- `n_samples`
- `sampler`
- `width`, `height`
- `strength` (img2img/inpaint)
- `noise` and advanced toggles (mode-specific)

Advanced/community fields frequently seen:

- `qualityToggle`
- `sm` / `sm_dyn` (SMEA toggles)
- `cfg_rescale`
- `noise_schedule` (`native`, `karras`, `exponential`, `polyexponential`)
- `dynamic_thresholding`
- `controlnet_model`, `controlnet_condition`, `controlnet_strength`
- `add_original_image`
- `extra_noise_seed`
- `skip_cfg_above_sigma`

V4 prompt object fields seen in community SDKs:

- `v4_prompt`
- `v4_negative_prompt`
- nested controls such as `use_coords` and `use_order`

## 4. Request/Response Formats

## 4.1 Content Types

- Generation usually accepts multipart payloads with JSON `input` field and optional image/mask binaries.
- Some wrappers successfully use JSON + base64 image fields for certain actions.
- Responses vary by endpoint:
  - ZIP archives for generation/augmentation
  - JSON for metadata endpoints
  - Raw image bytes for upscale

## 4.2 Error Shapes

Not consistently documented. Community wrappers generally expect:

- JSON error payloads with message/details
- HTTP status based failures (`401`, `403`, `422`, `429`, `5xx`)

Recommendation: normalize unknown server errors into a single CLI error format that includes HTTP status + parsed body snippet.

## 5. Rate Limits and Quotas

- No explicit per-minute/per-second rate-limit policy was found in official user docs or public Swagger mirror. (`Official` + `Mirror`)
- Practical control mechanism appears to be account quota/credit usage (Anlas) and server-side throttling. (`Official` + `Community`)
- Implement client-side safeguards:
  - bounded concurrency
  - retry with exponential backoff on `429`/`503`
  - idempotent output naming for retry safety

## 6. Known Quirks and Undocumented Behavior

1. Endpoint name drift (`/ai/classify` vs `/ai/classify-image`).
2. Mixed request style support (multipart file parts vs base64 in JSON) depending on client/action.
3. `generate-image` response is frequently ZIP even for one image; CLI must always sniff/decompress.
4. Some advanced params are silently ignored depending on model/action (for example, certain ControlNet or scheduler flags on unsupported models).
5. Legacy fields (`uc`, `legacy_*`) still appear in community clients; do not assume all are valid on latest models.
6. Inpainting/img2img behavior depends on mask/source handling; missing mask may trigger fallback or server-side interpretation differences.

## 7. Implementation Guidance for `nai-cli`

1. Build transport that supports both JSON and multipart requests for `generate-image`.
2. Add automatic response handler:
   - if ZIP -> extract PNG(s) + metadata
   - if PNG/octet-stream -> write directly
   - if JSON -> parse and print structured output
3. Keep model/sampler registries data-driven and updateable.
4. Add endpoint fallback for classify path differences.
5. Treat docs as partially unstable and preserve `--raw` debug mode for quick API drift diagnosis.

## References

Official:

- https://docs.novelai.net/en/image
- https://docs.novelai.net/en/image-generation-settings
- https://docs.novelai.net/en/image-generation-advanced-settings
- https://docs.novelai.net/en/image-to-image
- https://docs.novelai.net/en/inpainting
- https://image.novelai.net/docs/index.html#/

Swagger-adjacent mirror:

- https://docs.newapi.ai/en/api/novelai-image/

Community SDKs and docs:

- https://novelai-api.readthedocs.io/en/latest/novelai_api/ai/
- https://novelai-api.readthedocs.io/en/latest/novelai_api/user/
- https://docs.rs/novelapi/latest/src/novelapi/image.rs.html
- https://docs.rs/novelapi/latest/src/novelapi/request.rs.html
- https://docs.rs/novelapi/latest/src/novelapi/options.rs.html
- https://docs.rs/novelapi/latest/src/novelapi/imagepreset.rs.html
- https://api.stash.wiki/novelai-api/endpoints/image/
