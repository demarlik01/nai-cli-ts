# nai-cli

📖 [한국어 문서](./README-ko.md)

NovelAI image generation CLI. Supports text-to-image, img2img, inpainting, upscaling, and tag suggestion.

## Installation

```bash
npm install -g nai-cli
```

Or build from source:

```bash
git clone https://github.com/demarlik01-ai/nai-cli-ts.git
cd nai-cli-ts
npm install
npm run build
```

Requires Node.js >= 18.

## Configuration

A NovelAI API token is required. Subscribe at [NovelAI](https://novelai.net) and obtain your token.

```bash
# Set token
nai config set-token <your-token>

# Show config (token is redacted)
nai config show

# Validate config
nai config validate
```

The token can also be set via the `NAI_API_TOKEN` environment variable (overrides the config file).

### Config File

Location: `~/.config/nai-cli/config.json` (respects `XDG_CONFIG_HOME`)

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

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | `1` | `1` | Config schema version |
| `apiToken` | string \| null | `null` | NovelAI bearer token |
| `defaultModel` | string | `nai-diffusion-4-5-curated` | Default model ID |
| `defaultSampler` | string | `k_euler_ancestral` | Default sampler ID |
| `defaultOutputDir` | string | `./outputs` | Default output directory |
| `requestTimeoutMs` | number | `60000` | Request timeout in ms |
| `maxRetries` | number | `3` | Max retry count (0–10) |
| `debug` | boolean | `false` | Enable debug logging |

## Global Options

```
--debug          Enable debug logging
--config <path>  Path to config.json
```

## Commands

### `generate` — Text-to-Image

Generate image(s) from a text prompt.

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

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--prompt <text>` | ✅ | — | Prompt text |
| `--negative <text>` | | — | Negative prompt |
| `--model <id>` | | Config default | Model ID |
| `--sampler <id>` | | Config default | Sampler ID |
| `--width <number>` | | `1024` | Image width (multiple of 64) |
| `--height <number>` | | `1024` | Image height (multiple of 64) |
| `--steps <number>` | | `28` | Sampling steps (1–50) |
| `--scale <number>` | | `5` | CFG scale |
| `--seed <number>` | | Random | Seed (0–4294967295) |
| `--out <dir>` | | Config default | Output directory |

### `img2img` — Image-to-Image

Generate image(s) from an input image and prompt.

```bash
nai img2img \
  --image input.png \
  --prompt "1girl, blue hair, school uniform" \
  --strength 0.7 \
  --noise 0.1 \
  --out ./outputs/
```

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--image <path>` | ✅ | — | Input image path |
| `--prompt <text>` | ✅ | — | Prompt text |
| `--strength <number>` | ✅ | — | Transformation strength (0–1) |
| `--noise <number>` | ✅ | — | Noise amount (0–1) |
| `--negative <text>` | | — | Negative prompt |
| `--model <id>` | | Config default | Model ID |
| `--sampler <id>` | | Config default | Sampler ID |
| `--width <number>` | | `1024` | Image width |
| `--height <number>` | | `1024` | Image height |
| `--steps <number>` | | `28` | Sampling steps |
| `--scale <number>` | | `5` | CFG scale |
| `--seed <number>` | | Random | Seed |
| `--out <dir>` | | Config default | Output directory |

### `inpaint` — Inpainting

Regenerate masked region of an image.

```bash
nai inpaint \
  --image input.png \
  --mask mask.png \
  --prompt "red eyes" \
  --strength 0.7 \
  --out ./outputs/
```

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--image <path>` | ✅ | — | Input image path |
| `--mask <path>` | ✅ | — | Mask image path |
| `--prompt <text>` | ✅ | — | Prompt text |
| `--strength <number>` | ✅ | — | Inpainting strength (0–1) |
| `--negative <text>` | | — | Negative prompt |
| `--model <id>` | | Config default | Model ID |
| `--sampler <id>` | | Config default | Sampler ID |
| `--width <number>` | | `1024` | Image width |
| `--height <number>` | | `1024` | Image height |
| `--steps <number>` | | `28` | Sampling steps |
| `--scale <number>` | | `5` | CFG scale |
| `--seed <number>` | | Random | Seed |
| `--out <dir>` | | Config default | Output directory |

### `upscale` — Image Upscaling

Upscale an image.

```bash
nai upscale --image input.png --scale 4 --out ./outputs/
```

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--image <path>` | ✅ | — | Input image path |
| `--scale <number>` | | `4` | Upscale factor |
| `--out <dir>` | | Config default | Output directory |

### `suggest-tags` — Tag Suggestion

Suggest prompt tags based on input text.

```bash
# JSON output (default)
nai suggest-tags --prompt "1girl, blue hair"

# Table output with Japanese tags
nai suggest-tags --prompt "1girl" --format table --lang jp
```

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--prompt <text>` | ✅ | — | Prompt text |
| `--model <id>` | | Config default | Model ID |
| `--lang <code>` | | — | Tag language (`en` or `jp`) |
| `--format <type>` | | `json` | Output format (`json` or `table`) |

### `config` — Configuration Management

```bash
nai config set-token <token>   # Save API token
nai config show                # Show config (token redacted)
nai config validate            # Validate config file
```

## Supported Models

| Model | ID |
|-------|-----|
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

V4/V4.5 models automatically use the V4 prompt structure (`v4_prompt`).

## Samplers

`k_euler`, `k_euler_ancestral`, `k_dpmpp_2s_ancestral`, `k_dpmpp_2m`, `k_dpmpp_sde`, `ddim`

## Output

- Image: `<model>-seed-<seed>-img-<n>.png`
- Metadata: `<model>-seed-<seed>-img-<n>.json`

Default output directory is `./outputs/` (configurable).

## License

MIT
