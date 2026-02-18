# nai-cli Architecture

## Project Structure

```text
nai-cli/
├── src/
│   ├── cli.ts                      # Entry point, commander wiring, global flags
│   ├── commands/
│   │   ├── generate.ts             # text-to-image with batch/concurrency/dry-run
│   │   ├── img2img.ts              # image-to-image (action=img2img)
│   │   ├── inpaint.ts              # inpainting (action=infill)
│   │   ├── upscale.ts              # /ai/upscale
│   │   ├── suggest-tags.ts         # /ai/generate-image/suggest-tags
│   │   ├── preset.ts               # save/load/list/delete generation presets
│   │   ├── config.ts               # get/set/init token and defaults
│   │   └── models.ts               # (stub, not yet registered)
│   ├── core/
│   │   ├── context.ts              # runtime context (config + logger + clock)
│   │   ├── errors.ts               # typed CLI/API error hierarchy
│   │   ├── output.ts               # path naming, JSON sidecar, safe writes
│   │   ├── validate.ts             # zod schemas + cross-field validation
│   │   ├── batch.ts                # prompt-file loading, batch matrix, concurrency runner
│   │   ├── manifest.ts             # manifest.jsonl append-only logging
│   │   └── template.ts             # output filename template engine
│   ├── config/
│   │   ├── paths.ts                # XDG path resolution
│   │   ├── schema.ts               # config interface + defaults + version
│   │   └── store.ts                # load/save/update config.json
│   ├── preset/
│   │   ├── schema.ts               # preset zod schema
│   │   └── store.ts                # save/load/list/delete preset JSON files
│   ├── novelai/
│   │   ├── client.ts               # fetch wrapper + auth + retries + exponential backoff
│   │   ├── endpoints.ts            # dual-host endpoint registry (image.novelai.net + api.novelai.net)
│   │   ├── models.ts               # model IDs, sampler IDs, generation constraints
│   │   ├── response.ts             # zip/json/png sniffing and normalization
│   │   └── payload/
│   │       ├── generate.ts         # payload builders for generate/img2img/infill (v4 prompt support)
│   │       ├── generate.test.ts    # unit tests for payload builders
│   │       └── upscale.ts          # upscale payload builder
│   ├── io/
│   │   ├── image.ts                # file load, mime detection, dimension parsing, base64 helpers
│   │   └── zip.ts                  # minimal ZIP extractor (no external deps)
│   └── types/
│       ├── api.ts                  # request/response DTOs (V4 prompt types, envelopes)
│       └── commands.ts             # CLI option interfaces per command
├── docs/
├── package.json
├── tsconfig.json
└── README.md
```

## Module Diagram

```text
CLI (commander)
  └─ commands/*
       ├─ core/context.ts          — build RuntimeContext (config + logger)
       ├─ core/validate.ts         — validate params before API call
       ├─ preset/store.ts          — load preset defaults (if --preset given)
       ├─ core/batch.ts            — expand prompt file × models × samplers matrix
       ├─ novelai/payload/*        — build request envelope
       ├─ novelai/client.ts        — HTTP call with retries
       │    └─ novelai/endpoints.ts
       ├─ novelai/response.ts      — normalize ZIP/PNG/JSON response
       │    └─ io/zip.ts, io/image.ts
       ├─ core/output.ts           — write images + JSON sidecar
       │    └─ core/template.ts    — resolve filename template
       └─ core/manifest.ts         — append to manifest.jsonl
```

## CLI Commands

### `nai generate`

Text-to-image generation. Supports single and batch modes.

```bash
# Single generation
nai generate --prompt "1girl" --model nai-diffusion-4-5-curated --out ./outputs

# Batch generation with prompt file
nai generate --prompts prompts.txt --models nai-diffusion-4-5-curated,nai-diffusion-4-5-full \
  --samplers k_euler,k_euler_ancestral --concurrency 3

# Dry run (validate without calling API)
nai generate --prompt "test" --dry-run

# With preset
nai generate --prompt "1girl" --preset my-preset

# Custom output template
nai generate --prompt "1girl" --output-template "{date}-{model}-{seed}"
```

Key features:
- **Batch matrix**: `--prompts` file × `--models` × `--samplers` produces a cartesian product of jobs
- **Concurrency**: `--concurrency N` runs up to N API calls in parallel
- **Dry run**: `--dry-run` validates inputs and prints the plan without calling the API
- **Presets**: `--preset <name>` loads saved parameter defaults
- **Output template**: `--output-template` with variables `{date}`, `{model}`, `{seed}`, `{index}`, `{prompt}`, `{sampler}`
- Maps to `POST /ai/generate-image` with `action=generate`

### `nai img2img`

```bash
nai img2img --image ./input.png --prompt "detailed background" --strength 0.45 --noise 0.2
```

Maps to `POST /ai/generate-image` with `action=img2img`.

### `nai inpaint`

```bash
nai inpaint --image ./base.png --mask ./mask.png --prompt "restore eyes" --strength 0.65
```

Maps to `POST /ai/generate-image` with `action=infill`.

### `nai upscale`

```bash
nai upscale --image ./small.png --scale 4 --out ./outputs
```

Maps to `POST /ai/upscale` (on `api.novelai.net`).

### `nai suggest-tags`

```bash
nai suggest-tags --prompt "girl with red jacket" --model nai-diffusion-4-5-curated --format table
```

Maps to `GET /ai/generate-image/suggest-tags` (on `image.novelai.net`).

### `nai preset`

```bash
nai preset save my-preset --model nai-diffusion-4-5-curated --width 1024 --height 1024 --steps 28
nai preset show my-preset
nai preset list
nai preset delete my-preset
```

Presets are stored as individual JSON files under `~/.config/nai-cli/presets/<name>.json`.

### `nai config`

```bash
nai config set-token <TOKEN>
nai config show
nai config validate
```

## Configuration

Path: `~/.config/nai-cli/config.json` (follows XDG)

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

- CLI flags override config defaults.
- `NAI_API_TOKEN` environment variable is supported for CI.
- Token is redacted in `config show` output.

## Data Flow

### Single Generation

```
CLI args + config + preset
  → validate (zod)
  → build payload (with V4 prompt for v4+ models)
  → POST /ai/generate-image
  → sniff response (ZIP → extract PNGs, or raw PNG)
  → write image files + JSON sidecar metadata
  → append manifest.jsonl (if enabled)
```

### Batch Generation

```
Load prompt file (prompts.txt, one per line, # comments skipped)
  → build matrix: prompts × models × samplers
  → print batch summary (job count)
  → run jobs with bounded concurrency (p-limit style)
  → each job: validate → generate → write output → append manifest
  → print final summary (success/fail counts)
```

## Output Files

Each generation produces:
- **Image**: `<output-dir>/<template>-<index>.png`
- **JSON sidecar**: `<output-dir>/<template>-<index>.json` (full request payload + metadata)
- **Manifest** (conditional): `<output-dir>/manifest.jsonl` (one JSON line per generation, append-only; written during batch runs or when `manifestEnabled` is set in config)

Manifest entry shape:
```json
{"prompt":"...","model":"...","sampler":"...","seed":0,"filename":"...","success":true,"timestamp":"..."}
```

## Preset Storage

Presets live as JSON files at `~/.config/nai-cli/presets/<name>.json`:

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

Name validation: alphanumeric, hyphens, and underscores only.

## Error Handling

Typed error hierarchy in `core/errors.ts`:

| Error Class | Code | Use Case |
|---|---|---|
| `ConfigError` | `CONFIG_ERROR` | Missing token, invalid config |
| `ValidationError` | `VALIDATION_ERROR` | Bad params, invalid dimensions |
| `ApiError` | `API_ERROR` | Non-2xx API response |
| `NetworkError` | `NETWORK_ERROR` | Fetch failures, timeouts |
| `IoError` | `IO_ERROR` | File read/write failures |

All errors are caught at the top level and printed as `[CODE] message`. Stack traces shown with `--debug`.

## Design Decisions

- **Zero runtime dependencies beyond commander + zod**: native `fetch`, native `zlib` for ZIP.
- **File-based storage**: JSON config, JSON preset files, JSONL manifest. No database.
- **Functional module pattern**: command handlers compose pure payload builders and client functions.
- **Domain isolation**: `commands/`, `novelai/`, `config/`, `core/`, `preset/`, `io/` stay decoupled.
- **Response-type sniffing**: normalize ZIP/PNG/JSON to a single output contract.
- **Data-driven constraints**: model/sampler/resolution tables centralized in `novelai/models.ts`.
- **Explicit validation**: reject invalid combinations before API call.
- **Safe output**: deterministic naming + no accidental overwrite.
- **Dual-host support**: `image.novelai.net` for generation, `api.novelai.net` for upscale/classify.
- **V4 prompt support**: automatic V4 prompt object construction for v4+ models.
