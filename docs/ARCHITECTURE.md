# nai-cli Architecture

## Project Structure
```text
nai-cli/
├── src/
│   ├── cli.ts                      # Entry point, commander wiring, global flags
│   ├── commands/
│   │   ├── generate.ts             # text-to-image (action=generate)
│   │   ├── img2img.ts              # image-to-image (action=img2img)
│   │   ├── inpaint.ts              # inpainting (action=infill)
│   │   ├── upscale.ts              # /ai/upscale
│   │   ├── suggest-tags.ts         # /ai/generate-image/suggest-tags
│   │   ├── models.ts               # list/inspect known models and samplers
│   │   └── config.ts               # get/set/init token and defaults
│   ├── core/
│   │   ├── context.ts              # runtime context (config + logger + clock)
│   │   ├── errors.ts               # typed CLI/API error mapping
│   │   ├── output.ts               # path naming, metadata files, safe writes
│   │   └── validate.ts             # zod schemas + cross-field validation
│   ├── config/
│   │   ├── paths.ts                # XDG path resolution
│   │   ├── schema.ts               # config interface + migration version
│   │   └── store.ts                # load/save config.json
│   ├── novelai/
│   │   ├── client.ts               # fetch wrapper + auth + retries
│   │   ├── endpoints.ts            # endpoint path registry + fallbacks
│   │   ├── payload/
│   │   │   ├── generate.ts         # envelope builders for generate/img2img/infill
│   │   │   ├── upscale.ts          # upscale payload builder
│   │   │   └── suggest-tags.ts     # suggest-tags payload builder
│   │   ├── models.ts               # model IDs, sampler IDs, constraints
│   │   └── response.ts             # zip/json/png sniffing and normalization
│   ├── io/
│   │   ├── image.ts                # file load, mime detection, base64 helpers
│   │   └── zip.ts                  # unzip generation outputs
│   └── types/
│       ├── api.ts                  # request/response DTOs
│       └── commands.ts             # CLI option types
├── docs/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
├── tsconfig.json
└── README.md
```

## Module Diagram
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

## CLI Commands (Image Focus)

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

- Maps to `POST /ai/generate-image` with `action=generate`.

## 2) `img2img`

```bash
nai img2img \
  --image ./input.png \
  --prompt "masterpiece, detailed background" \
  --strength 0.45 \
  --noise 0.2 \
  --model nai-diffusion-4-5-full
```

- Maps to `POST /ai/generate-image` with `action=img2img`.

## 3) `inpaint`

```bash
nai inpaint \
  --image ./base.png \
  --mask ./mask.png \
  --prompt "restore eyes, natural shading" \
  --strength 0.65 \
  --model nai-diffusion-3-inpainting
```

- Maps to `POST /ai/generate-image` with `action=infill`.

## 4) `upscale`

```bash
nai upscale \
  --image ./small.png \
  --scale 4 \
  --out ./outputs
```

- Maps to `POST /ai/upscale`.

## 5) `suggest-tags`

```bash
nai suggest-tags \
  --model nai-diffusion-4-5-curated \
  --prompt "girl with red jacket"
```

- Maps to `POST /ai/generate-image/suggest-tags`.

## 6) `config`

```bash
nai config set-token <TOKEN>
nai config show
nai config validate
```

- Manages local auth/settings file.

## Config Management

Path:

- `~/.config/nai-cli/config.json` (XDG base config path)

Example:

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

Rules:

- `apiToken` is required for API calls.
- `version` drives future migration logic.
- CLI flags override config defaults.
- Environment override is allowed for CI (`NAI_API_TOKEN`), but file remains primary source.

## Design Decisions

- Functional module pattern: command handlers call pure payload builders and client functions.
- Domain separation: `commands`, `novelai`, `config`, `core`, and `io` stay isolated.
- Native `fetch` (Node >= 18): avoid heavy HTTP dependencies.
- Response-type sniffing: normalize ZIP/PNG/JSON to a single output contract.
- Data-driven capabilities: model/sampler/constraint tables are centralized in `novelai/models.ts`.
- Explicit validation: reject invalid width/height/model-action combinations before API call.
- Safe output behavior: deterministic naming + metadata sidecar + no accidental overwrite by default.
