export const OTHER_CATEGORY = "Other";
export const CATEGORY_NAME_MAX = 40;

// Preset palette (all reach at least 4.5:1 contrast against white).
export const CATEGORY_COLORS = [
  { value: "#15803d", name: "Green" },
  { value: "#1d4ed8", name: "Blue" },
  { value: "#0f766e", name: "Teal" },
  { value: "#7e22ce", name: "Purple" },
  { value: "#be185d", name: "Pink" },
  { value: "#c2410c", name: "Orange" },
  { value: "#a16207", name: "Amber" },
  { value: "#475569", name: "Slate" },
] as const;

export function isPaletteColor(value: unknown): value is string {
  return CATEGORY_COLORS.some((c) => c.value === value);
}

export function colorName(value: string): string {
  return CATEGORY_COLORS.find((c) => c.value === value)?.name ?? "Custom";
}

export function isOther(name: string): boolean {
  return name.trim().toLowerCase() === OTHER_CATEGORY.toLowerCase();
}
