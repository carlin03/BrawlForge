import { COUNTRY_CODES } from "./countries";

export type CountryOption = {
  /** ISO 3166-1 alpha-2 (minúsculas) — valor guardado en BD */
  code: string;
  /** Nombre en español para el buscador */
  label: string;
  /** Nombre en inglés (respaldo) */
  name: string;
  search: string;
};

let optionsCache: CountryOption[] | null = null;

function isoCountryCodes(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  if (typeof intl.supportedValuesOf === "function") {
    try {
      const list = intl.supportedValuesOf("region").filter((c) => /^[A-Z]{2}$/.test(c));
      if (list.length >= 200) return list;
    } catch {
      /* entorno sin lista de regiones */
    }
  }
  const fromMap = new Set(Object.values(COUNTRY_CODES));
  for (const key of Object.keys(COUNTRY_CODES)) {
    const code = COUNTRY_CODES[key];
    if (code && code !== "un") fromMap.add(code);
  }
  return [...fromMap].map((c) => c.toUpperCase());
}

export function getCountryOptions(): CountryOption[] {
  if (optionsCache) return optionsCache;
  const es = new Intl.DisplayNames(["es"], { type: "region" });
  const en = new Intl.DisplayNames(["en"], { type: "region" });
  optionsCache = isoCountryCodes()
    .map((code) => {
      const iso = code.toLowerCase();
      const label = es.of(code) ?? code;
      const name = en.of(code) ?? label;
      return {
        code: iso,
        label,
        name,
        search: `${label} ${name} ${iso} ${code}`.toLowerCase(),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
  return optionsCache;
}

/** Resuelve texto libre, ISO2 o nombre antiguo → opción del catálogo */
export function findCountryOption(value: string | null | undefined): CountryOption | null {
  const raw = value?.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const options = getCountryOptions();

  const byCode = options.find((o) => o.code === lower);
  if (byCode) return byCode;

  const titled = raw
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  if (COUNTRY_CODES[raw]) {
    const code = COUNTRY_CODES[raw].toLowerCase();
    return options.find((o) => o.code === code) ?? null;
  }
  if (COUNTRY_CODES[titled]) {
    const code = COUNTRY_CODES[titled].toLowerCase();
    return options.find((o) => o.code === code) ?? null;
  }

  const byLabel = options.find(
    (o) =>
      o.label.toLowerCase() === lower ||
      o.name.toLowerCase() === lower ||
      o.label.toLowerCase() === titled.toLowerCase() ||
      o.name.toLowerCase() === titled.toLowerCase(),
  );
  if (byLabel) return byLabel;

  if (lower.length >= 3) {
    const partial = options.filter(
      (o) =>
        o.label.toLowerCase().includes(lower) ||
        o.name.toLowerCase().includes(lower) ||
        o.search.includes(lower),
    );
    if (partial.length === 1) return partial[0];
  }

  return null;
}

export function countryDisplayLabel(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return findCountryOption(value)?.label ?? value.trim();
}

/** Valor canónico para guardar (ISO2 si se reconoce) */
export function countryValueForStorage(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  const opt = findCountryOption(value);
  return opt?.code ?? value.trim();
}

export function filterCountryOptions(query: string, limit = 14): CountryOption[] {
  const q = query.trim().toLowerCase();
  const options = getCountryOptions();
  if (!q) return options.slice(0, limit);
  const tokens = q.split(/\s+/).filter(Boolean);
  return options
    .filter((o) => tokens.every((t) => o.search.includes(t)))
    .slice(0, limit);
}
