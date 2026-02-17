# nai-cli Implementation Plan

Date: 2026-02-17

## Goals

- Deliver a reliable TypeScript CLI for NovelAI image workflows.
- Start with high-confidence API paths, then expand feature depth.
- Handle API drift safely (fallback paths, strict validation, debug visibility).

## Phase 1: Core

Scope:

- Auth/config foundation.
- Basic text-to-image generation (`generate`).
- Stable output handling.

Work items:

- Bootstrap CLI runtime (`commander`, global flags, error boundary).
- Implement config store at `~/.config/nai-cli/config.json`.
- Implement `nai config set-token`, `nai config show`, `nai config validate`.
- Build NovelAI HTTP client with Bearer auth, timeout, retries (`429`/`503`), and normalized errors.
- Implement `nai generate` payload builder (`model`, `action=generate`, `parameters`).
- Implement response parser for ZIP/PNG/JSON and output writer with metadata sidecar.
- Add unit tests for payload serialization and response decoding.
- Add mocked integration tests for happy path and failure path.

Deliverables:

- `nai generate` works end-to-end with token from config.
- Deterministic output naming and metadata output.
- Core test suite passing for serializers/parsers.

Exit criteria:

- A new machine can generate an image after setting token once.
- Auth failures and invalid params produce clear CLI errors.
- ZIP responses are decoded and written correctly.

## Phase 2: Advanced

Scope:

- Image-to-image features.
- Inpainting and advanced generation controls.
- Additional image-related endpoints.

Work items:

- Implement `nai img2img` with source image support and `strength` controls.
- Implement `nai inpaint` with mask validation and `action=infill` payload flow.
- Add multipart and JSON/base64 compatibility strategy for mode-specific payloads.
- Implement `nai upscale` with binary-response handling.
- Implement `nai suggest-tags` with table/JSON output modes.
- Extend model registry with advanced params: SMEA flags, noise schedule, cfg-rescale, controlnet fields.
- Add endpoint fallback logic for path drift (for example `/ai/classify-image` vs `/ai/classify` if classify command is added).
- Expand fixture coverage for advanced endpoints and mixed response types.

Deliverables:

- `nai img2img`, `nai inpaint`, `nai upscale`, and `nai suggest-tags`.
- Robust encoder/decoder flow for action-specific request/response shapes.
- Broader validation and integration fixtures.

Exit criteria:

- Advanced commands succeed end-to-end with predictable files.
- Incompatible model/action/parameter combinations are blocked preflight.

## Phase 3: Polish

Scope:

- UX and productivity features.
- Presets, batching, and output management.
- Packaging/release readiness.

Work items:

- Add preset system (`~/.config/nai-cli/presets/*.json`) with merge/override behavior.
- Add batch generation from prompt files and matrix combinations (model/sampler/seed).
- Add bounded concurrency controls and progress reporting.
- Add output naming templates (`{date}`, `{model}`, `{seed}`, `{index}`).
- Add manifest logging (`manifest.jsonl`) for reproducibility.
- Add shell completion and richer command help examples.
- Add `--dry-run` mode for validation without API calls.
- Set up npm packaging flow, semantic versioning, and changelog process.
- Finalize troubleshooting docs and API drift update playbook.

Deliverables:

- Presets and batching suitable for production workflows.
- Release-ready package and complete operator documentation.

Exit criteria:

- Reproducible large runs with minimal manual flag repetition.
- Smoke tests pass on Linux/macOS/Windows (Node LTS).

## Cross-Phase Technical Rules

- Keep endpoint registry centralized in `src/novelai/endpoints.ts`.
- Keep model/sampler/action metadata data-driven in one place.
- Detect response type from headers and magic bytes, not endpoint assumptions only.
- Add a fixture any time a new response shape is handled.
- Preserve `--debug` with sanitized request/response summaries.

## Risks and Mitigations

- API documentation drift.
- Mitigation: endpoint fallbacks, quick registry updates, raw debug diagnostics.

- Multipart vs JSON payload ambiguity.
- Mitigation: dual encoder strategy selected by command/action.

- Unpublished limits/quotas.
- Mitigation: retry/backoff, configurable concurrency, idempotent output writes.

- Model capability mismatches.
- Mitigation: preflight compatibility table and explicit error messages.
