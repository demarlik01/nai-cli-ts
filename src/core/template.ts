export interface TemplateVariables {
  date: string;
  model: string;
  seed: string;
  index: string;
  prompt: string;
  sampler?: string | undefined;
}

function sanitizeToken(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "unknown";
}

export function renderTemplate(template: string, vars: TemplateVariables): string {
  return template
    .replace(/\{date\}/g, vars.date)
    .replace(/\{model\}/g, sanitizeToken(vars.model))
    .replace(/\{seed\}/g, vars.seed)
    .replace(/\{index\}/g, vars.index)
    .replace(/\{prompt\}/g, sanitizeToken(vars.prompt.slice(0, 50)))
    .replace(/\{sampler\}/g, sanitizeToken(vars.sampler ?? "unknown"));
}
