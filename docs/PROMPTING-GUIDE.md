# NovelAI Image Prompting Guide

A comprehensive guide for crafting effective NovelAI image generation prompts. Designed for both human users and AI agents.

> **Sources:** This guide synthesizes information from [NovelAI official documentation](https://docs.novelai.net/en/image/), community resources, and practical experimentation. Official information is unmarked; community-sourced tips are marked with 💡.

---

## Table of Contents

1. [Model Overview](#model-overview)
2. [Prompt Structure](#prompt-structure)
3. [Danbooru Tag System](#danbooru-tag-system)
4. [Quality & Aesthetic Tags](#quality--aesthetic-tags)
5. [Strengthening & Weakening](#strengthening--weakening)
6. [Negative Prompts (Undesired Content)](#negative-prompts-undesired-content)
7. [Multi-Character Prompting](#multi-character-prompting)
8. [Parameter Guide](#parameter-guide)
9. [Practical Examples](#practical-examples)
10. [Using with nai-cli](#using-with-nai-cli)
11. [Resources](#resources)

---

## Model Overview

### Current Models

| Model ID | Name | Description |
|----------|------|-------------|
| `nai-diffusion-4-5-curated` | V4.5 Curated | Latest model. Cleaner, safer dataset. Best for general use. |
| `nai-diffusion-4-5-full` | V4.5 Full | Latest model. Broader dataset, more versatile. Try when Curated can't do something. |
| `nai-diffusion-4-curated` | V4 Curated | Previous gen. Original model (not based on SD). |
| `nai-diffusion-4-full` | V4 Full | Previous gen, broader dataset than V4 Curated. |
| `nai-diffusion-3` | Anime V3 | Based on SDXL. Tag order strongly affects output. |
| `nai-diffusion-furry-3` | Furry V3 | Furry-focused V3. Uses e621-style tags, not Danbooru. |

### Key Differences

| Feature | V3 | V4 / V4.5 |
|---------|-----|-----------|
| Base | SDXL | Original (from scratch) |
| Tokenizer | CLIP | T5 (case-sensitive) |
| Prompt limit | ~225 CLIP tokens | ~512 T5 tokens |
| Tag ordering | Earlier = stronger | Less position-dependent |
| Natural language | Limited | Good understanding |
| Multi-character | Not supported | Up to 6 characters |
| Text rendering | Poor | Improved (English) |
| Numerical emphasis | Not available | `1.5::tag ::` syntax |
| Negative emphasis | Not available | V4.5 only: `-1::tag ::` |
| Unicode in prompts | Supported | Not supported (T5 limitation) |

### Curated vs Full

- **Curated**: Cleaner dataset, more predictable, safer for streaming. Less capable with niche concepts.
- **Full**: Broader dataset, handles specific/unusual concepts better. May produce unexpected content.

### Special Modes (V4+)

- **Furry mode**: Start prompt with `fur dataset,` to access furry/kemono art styles.
- **Background mode** (V4.5+): Start with `background dataset,` for landscapes, still lifes, animal portraits in photographic style.

---

## Prompt Structure

### Recommended Order

For V3 (order matters more):
```
[count]boy/girl, character name, series name, appearance details, clothing, pose, expression, background, style tags, quality tags
```

For V4/V4.5 (order is less critical, but still recommended):
```
subject count, scene/setting tags, character details (in character prompts), quality/aesthetic tags
```

### Anatomy of a Good Prompt

A prompt typically consists of these layers:

1. **Subject count**: `1girl`, `2boys`, `1other`
2. **Character identity**: Character name, series (use Danbooru tag format)
3. **Physical appearance**: Hair (color, style, length), eyes, body type
4. **Clothing & accessories**: Specific garment tags
5. **Pose & expression**: `smile`, `arms up`, `sitting`, `looking at viewer`
6. **Framing**: `portrait`, `cowboy shot`, `full body`, `from above`, `from below`
7. **Background & setting**: `outdoors`, `classroom`, `night sky`, `cityscape`
8. **Style & medium**: Artist names, `watercolor (medium)`, `year 2024`
9. **Quality tags**: `best quality`, `very aesthetic`, `masterpiece`

### Natural Language vs Tags

V4/V4.5 understands natural language well. You can mix tags with descriptive sentences:

```
1girl, long silver hair, red eyes, elegant black dress,
She is standing on a balcony overlooking a moonlit city.
very aesthetic, masterpiece
```

💡 **Community tip**: Tags still tend to be more reliable and precise than natural language for specific visual elements. Use natural language for scene descriptions and relationships.

---

## Danbooru Tag System

NovelAI's anime models are trained on data tagged with the [Danbooru](https://danbooru.donmai.us/) tagging system. Using correct Danbooru tags significantly improves results.

### Tag Format

- Lowercase, underscore-separated (but commas between tags): `long_hair` → type as `long hair`
- NovelAI's prompt box auto-suggests known tags with familiarity indicators
- V4+ uses T5 tokenizer: **prompts are case-sensitive**. Use lowercase for Danbooru tags.

### Major Tag Categories

| Category | Examples | Notes |
|----------|----------|-------|
| **Character** | `hatsune miku`, `saber (fate)` | Use exact Danbooru tag name |
| **Series/Copyright** | `fate/grand order`, `genshin impact` | Helps with character recognition |
| **Artist** | `wlop`, `kuvshinov ilya` | Controls art style strongly |
| **Hair** | `blonde hair`, `long hair`, `twintails`, `hair ribbon` | Combine color + length + style |
| **Eyes** | `blue eyes`, `heterochromia`, `closed eyes` | |
| **Expression** | `smile`, `blush`, `crying`, `open mouth` | |
| **Clothing** | `school uniform`, `armor`, `sundress`, `hoodie` | Be specific for best results |
| **Pose/Action** | `sitting`, `running`, `arms behind back`, `peace sign` | |
| **Framing** | `portrait`, `upper body`, `cowboy shot`, `full body` | Determines crop/zoom |
| **Angle** | `from above`, `from below`, `from side`, `dutch angle` | Camera perspective |
| **Background** | `outdoors`, `classroom`, `starry sky`, `simple background` | |
| **Medium** | `watercolor (medium)`, `ink (medium)`, `3d (medium)` | Art medium/technique |
| **Rating** | `rating:general`, `rating:sensitive` | Content rating control |

### Character Names

Use the **exact Danbooru tag name** for characters:
- ✅ `yorha no. 2 type b` (Danbooru tag)
- ❌ `2b` (common name, won't work well)
- ✅ `hatsune miku`
- ✅ `artoria pendragon (fate)`

💡 **Community tip**: Search characters on [Danbooru](https://danbooru.donmai.us/tags?search%5Border%5D=count) to find the exact tag name.

### Artist Tags for Style Consistency

💡 **Community tip**: Artist tags are the most reliable way to maintain consistent art style across generations. Some well-known working artist tags:

- `wlop` — Semi-realistic, painterly
- `kuvshinov ilya` — Clean anime style
- `makoto shinkai` — Scenic backgrounds
- `ilya kuvshinov` — Stylish character art
- `greg rutkowski` — Fantasy/painterly

Place artist tags early in the prompt for stronger effect (especially on V3).

---

## Quality & Aesthetic Tags

These special tags control the overall quality and style of generations.

### Quality Tags

| Tag | Effect |
|-----|--------|
| `best quality` | Highest quality |
| `amazing quality` | Very high quality |
| `great quality` | Good quality |
| `normal quality` | Standard |
| `bad quality` | Lower quality (use in negative) |
| `worst quality` | Worst quality (use in negative) |

### Aesthetic Tags

| Tag | Model | Effect |
|-----|-------|--------|
| `masterpiece` | V4.5 | Highest aesthetic tier |
| `top aesthetic` | V4 only | Highest aesthetic tier |
| `very aesthetic` | All | High aesthetic quality |
| `aesthetic` | All | Good aesthetic quality |
| `displeasing` | All | Lower aesthetic (use in negative) |
| `very displeasing` | All | Worst aesthetic (use in negative) |

### Year Tags

`year XXXX` — Influences the art style to match the prevalent style of that year.

```
year 2024    → Modern, clean anime style
year 2010    → Mid-era anime style
year 2000    → Older anime aesthetic
```

### Auto Quality Tags (Default Preamble)

NovelAI adds quality tags automatically when "Add Quality Tags" is enabled:

| Model | Auto-appended tags |
|-------|-------------------|
| V4.5 Full | `, location, very aesthetic, masterpiece, no text` |
| V4.5 Curated | `, location, masterpiece, no text, -0.8::feet::, rating:general` |
| V4 Full | `, no text, best quality, very aesthetic, absurdres` |
| V4 Curated | `, rating:general, amazing quality, very aesthetic, absurdres` |
| V3 | `, best quality, amazing quality, very aesthetic, absurdres` |

> **Note for nai-cli**: The CLI does not auto-add quality tags. Include them manually in your prompts or save them in a preset's prompt.

---

## Strengthening & Weakening

### Bracket Syntax (All Models)

- `{tag}` — Strengthen by ×1.05
- `[tag]` — Weaken by ÷1.05
- Nesting multiplies: `{{tag}}` = ×1.1025, `{{{tag}}}` = ×1.1576

```
1girl, {blue eyes}, [[short hair]], {{{dramatic lighting}}}
```

### Numerical Emphasis (V4+ Only)

More precise control with `::` syntax:

```
1girl, 1.5::rain, night ::, 0.5::coat ::, black shoes
```

- `1.5::text ::` — Strengthen to 1.5×
- `0.5::text ::` — Weaken to 0.5×
- `::` closes any open brackets too

### Negative Numerical Emphasis (V4.5+ Only)

Use negative values for targeted removal or concept inversion:

```
-1::hat ::           → Remove a hat the character usually wears
-1::monochrome ::    → Force color into a desaturated image
-2.5::flat color ::  → Add more detail/shading
-1::simple background ::  → Force a detailed background
```

**When to use negative emphasis vs Undesired Content:**
- **Negative emphasis**: Better for targeted removal/inversion of specific concepts
- **Undesired Content**: Better for a long list of things to generally avoid

---

## Negative Prompts (Undesired Content)

Negative prompts (called "Undesired Content" in NovelAI) tell the AI what to avoid.

### Official Presets

#### V4.5 Full — Heavy (Recommended)

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

#### V4.5 Curated — Heavy (Recommended)

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

### Custom Negative Prompt Tips

💡 **Community tips**:
- Add `bad anatomy, bad hands` for character-focused images
- Add `extra fingers, missing fingers, extra digits, fewer digits` for hand quality
- For V3, use `{bad}` (strengthened) — it's a catch-all trained tag
- Adding `tattoo` can sometimes fix freckle artifacts (official tip)
- In Undesired Content, `{tag}` means *more avoided*, `[tag]` means *less avoided*

---

## Multi-Character Prompting

Available on V4+ models. Supports up to 6 characters.

### Syntax

Use `|` to separate base prompt and character prompts:

```
base prompt | character 1 prompt | character 2 prompt
```

### Rules

1. **Subject count tags** (`2girls`, `1boy`) go in the **base prompt**
2. Each character prompt uses `girl`, `boy`, or `other` (no number)
3. Characters appear left-to-right in the order listed

### Interaction Tags

Prefix action tags with `source#`, `target#`, or `mutual#`:

```
2girls, indoors, café | girl, blonde hair, source#hug | girl, black hair, target#hug
```

- `source#hug` — This character is doing the hugging
- `target#hug` — This character is being hugged
- `mutual#hug` — Both characters are hugging each other

### Example

```
2girls, indoors, factory, night, fog, aesthetic, best quality |
girl, purple eyes, short hair, smile, blonde hair, red blouse, pleated skirt, cowboy shot |
girl, very long hair, purple hair, white jeans, green eyes, turtleneck sweater, cowboy shot
```

---

## Parameter Guide

### Steps

| Value | Use Case |
|-------|----------|
| 1–10 | Quick preview / composition check |
| 20–28 | Standard generation (recommended) |
| 28 | Opus free tier limit |
| 29–50 | Diminishing returns; sometimes counterproductive |

> **Tip**: Use low steps to find good compositions, then Enhance for refinement.

### Prompt Guidance (CFG Scale)

| Value | Effect |
|-------|--------|
| 1–3 | Very creative, loose interpretation, soft/painterly |
| 4–6 | **Recommended range (V3+)**. Good balance of prompt adherence and quality |
| 5–6 | Sweet spot for most generations |
| 7–10 | Stronger prompt adherence, more detail/sharpness |
| 10+ | Risk of oversaturation, artifacts. Use Decrisper or Guidance Rescale |

- **Decrisper** (toggle): Mitigates color/visual artifacts at higher guidance. Works at any value.
- **Prompt Guidance Rescale** (V3): Alleviates color saturation at high guidance.

### Samplers

| Sampler | Notes |
|---------|-------|
| `k_euler_ancestral` | **Recommended**. Consistent, high quality. |
| `k_dpmpp_2m` | **Recommended**. Consistent, high quality. |
| `k_euler` | Standard Euler. Deterministic. |
| `k_dpmpp_2s_ancestral` | Ancestral variant. More variation. |
| `k_dpmpp_sde` | SDE variant. Different aesthetic. |
| `ddim` | Older sampler. No SMEA support. |

#### SMEA & SMEA DYN

- **SMEA**: Improves coherency at high resolutions. Slightly softer look. Costs more Anlas.
- **SMEA DYN**: Less soft than SMEA, reduces high-res artifacts without the characteristic softness.
- **Auto SMEA**: Automatically applies for images >1024×1024.
- Both prevent duplicated subjects and warped anatomy at higher resolutions.

### Resolution

Common resolutions (must be multiples of 64):

| Aspect | Portrait | Landscape | Use |
|--------|----------|-----------|-----|
| 1:1 | 1024×1024 | — | Square compositions |
| 2:3 | 832×1216 | 1216×832 | **Default portrait/landscape** |
| 9:16 | 768×1344 | 1344×768 | Phone wallpaper |
| 3:4 | 896×1152 | 1152×896 | Standard photo ratio |

> Opus subscribers: Free generation at ≤28 steps, normal resolution range, single image.

---

## Practical Examples

### High-Quality Portrait (V4.5)

```bash
nai generate \
  --model nai-diffusion-4-5-curated \
  --prompt "1girl, long silver hair, blue eyes, gentle smile, white sundress, flower crown, standing in a sunflower field, golden hour, wind blowing hair, very aesthetic, masterpiece" \
  --negative "lowres, artistic error, worst quality, bad quality, jpeg artifacts, very displeasing, bad anatomy" \
  --width 832 --height 1216 \
  --steps 28 --scale 5
```

### Dynamic Action Scene

```bash
nai generate \
  --prompt "1boy, spiky black hair, red eyes, black coat, dual wielding swords, dynamic pose, battle stance, sparks, dark castle interior, dramatic lighting, rain, very aesthetic, masterpiece" \
  --negative "lowres, artistic error, worst quality, bad quality, jpeg artifacts, very displeasing, multiple views, bad anatomy" \
  --width 1216 --height 832 \
  --steps 28 --scale 6
```

### Landscape / Background (V4.5)

```bash
nai generate \
  --prompt "background dataset, mountain lake at sunset, snow-capped peaks, reflection in water, pine forest, dramatic clouds, golden light, very aesthetic, masterpiece" \
  --negative "lowres, worst quality, bad quality, jpeg artifacts, very displeasing, text, watermark" \
  --width 1216 --height 832 \
  --steps 28 --scale 5
```

### Two Characters Interacting (V4.5)

```bash
nai generate \
  --prompt "2girls, outdoors, cherry blossom, spring, park bench, very aesthetic, masterpiece | girl, long black hair, red eyes, school uniform, smile, sitting, source#pointing at another | girl, short blonde hair, green eyes, casual clothes, standing, target#pointing, blush" \
  --negative "lowres, artistic error, worst quality, bad quality, very displeasing, bad anatomy" \
  --width 1216 --height 832 \
  --steps 28 --scale 5
```

### Specific Art Style with Year Tag

```bash
nai generate \
  --prompt "1girl, red hair, ponytail, green eyes, miko outfit, holding broom, shrine, autumn leaves, year 2020, very aesthetic, masterpiece" \
  --negative "lowres, worst quality, bad quality, very displeasing" \
  --width 832 --height 1216 \
  --steps 28 --scale 5
```

### Furry Mode (V4.5)

```bash
nai generate \
  --model nai-diffusion-4-5-full \
  --prompt "fur dataset, 1other, anthro fox, orange fur, blue eyes, adventurer outfit, leather armor, forest path, sunlight through trees, very aesthetic, masterpiece" \
  --negative "lowres, worst quality, bad quality, very displeasing" \
  --width 832 --height 1216 \
  --steps 28 --scale 5
```

---

## Using with nai-cli

### Save Reusable Presets

Store your preferred settings to avoid repeating them:

```bash
# High-quality portrait preset
nai preset save hq-portrait \
  --model nai-diffusion-4-5-curated \
  --width 832 --height 1216 \
  --steps 28 --scale 5

# Then generate with just a prompt
nai generate --preset hq-portrait \
  --prompt "1girl, blue hair, school uniform, smile, very aesthetic, masterpiece" \
  --negative "lowres, worst quality, bad quality, very displeasing, bad anatomy"
```

### Preset with Negative Prompt

```bash
nai preset save safe-defaults \
  --model nai-diffusion-4-5-curated \
  --width 832 --height 1216 \
  --steps 28 --scale 5 \
  --negative "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, bad anatomy, multiple views"
```

### Batch Generation with Prompt File

Create a `prompts.txt`:
```
1girl, long red hair, green eyes, witch hat, holding staff, forest, very aesthetic, masterpiece
1boy, silver armor, knight, castle courtyard, sunset, very aesthetic, masterpiece
1girl, blue kimono, cherry blossom, shrine, spring, very aesthetic, masterpiece
```

```bash
nai generate --preset hq-portrait --prompts prompts.txt --concurrency 2
```

### Model Comparison Matrix

Compare models side-by-side:

```bash
nai generate \
  --prompt "1girl, long hair, school uniform, classroom, very aesthetic" \
  --negative "lowres, worst quality" \
  --models nai-diffusion-4-5-curated,nai-diffusion-4-5-full,nai-diffusion-3 \
  --width 832 --height 1216 \
  --steps 28 --scale 5
```

### Dry Run for Validation

```bash
nai generate --preset hq-portrait --prompt "test prompt" --dry-run
```

---

## Resources

### Official
- [NovelAI Documentation — Image Generation](https://docs.novelai.net/en/image/)
- [Tagging Guide](https://docs.novelai.net/en/image/tags/)
- [Strengthening & Weakening](https://docs.novelai.net/en/image/strengthening-weakening/)
- [Multi-Character Prompting](https://docs.novelai.net/en/image/multiplecharacters/)
- [Sampling Methods](https://docs.novelai.net/en/image/sampling/)
- [Undesired Content Presets](https://docs.novelai.net/en/image/undesiredcontent/)

### Community
- [nax.moe](https://nax.moe/) — NovelAI tag experiment gallery. Shows how individual tags affect output with controlled comparisons.
- [Danbooru Tag Search](https://danbooru.donmai.us/tags) — Find exact tag names and popularity
- [Reddit r/NovelAi](https://www.reddit.com/r/NovelAi/) — Community discussions and guides

### Quick Reference for AI Agents

When constructing prompts programmatically:

```
MODEL:    nai-diffusion-4-5-curated (safe) or nai-diffusion-4-5-full (versatile)
SIZE:     832×1216 (portrait) or 1216×832 (landscape) or 1024×1024 (square)
STEPS:    28
SCALE:    5.0
SAMPLER:  k_euler_ancestral

PROMPT TEMPLATE:
  [subject count], [character details], [pose/action], [setting], [quality tags]

QUALITY SUFFIX:
  very aesthetic, masterpiece

NEGATIVE TEMPLATE:
  lowres, artistic error, worst quality, bad quality, jpeg artifacts, very displeasing, bad anatomy
```
