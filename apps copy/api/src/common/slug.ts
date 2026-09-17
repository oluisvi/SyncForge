export function slugify(value: string): string {
  const base = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 110);
  return base || "untitled";
}
export function uniqueSlug(base: string): string { return `${slugify(base)}-${crypto.randomUUID().slice(0, 8)}`; }
