/** ISO 3166-1 alpha-2 para banderas (flagcdn.com) */
export const COUNTRY_CODES: Record<string, string> = {
  Japan: "jp",
  China: "cn",
  India: "in",
  Germany: "de",
  germany: "de",
  Spain: "es",
  "United States": "us",
  USA: "us",
  Turkey: "tr",
  France: "fr",
  Brazil: "br",
  Italy: "it",
  Poland: "pl",
  Sweden: "se",
  Mexico: "mx",
  Argentina: "ar",
  Chile: "cl",
  Colombia: "co",
  Peru: "pe",
  Canada: "ca",
  Australia: "au",
  "South Korea": "kr",
  Korea: "kr",
  Philippines: "ph",
  Indonesia: "id",
  Thailand: "th",
  Vietnam: "vn",
  "United Kingdom": "gb",
  UK: "gb",
  Netherlands: "nl",
  Portugal: "pt",
  Belgium: "be",
  Switzerland: "ch",
  Austria: "at",
  Norway: "no",
  Denmark: "dk",
  Finland: "fi",
  Greece: "gr",
  Romania: "ro",
  Hungary: "hu",
  "Czech Republic": "cz",
  Ukraine: "ua",
  Russia: "ru",
  Israel: "il",
  "South America": "br",
  Taiwan: "tw",
  "Hong Kong": "hk",
  Singapore: "sg",
  Malaysia: "my",
};

const ALIASES: Record<string, string> = {
  cn: "cn",
  china: "cn",
  in: "in",
  india: "in",
  de: "de",
  br: "br",
  brazil: "br",
};

function normalizeCountryKey(country: string): string {
  const t = country.trim();
  if (!t) return "";
  if (COUNTRY_CODES[t]) return t;
  const titled = t
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  if (COUNTRY_CODES[titled]) return titled;
  const lower = t.toLowerCase();
  if (ALIASES[lower]) return lower;
  return titled;
}

export function getCountryCode(country: string): string {
  const key = normalizeCountryKey(country);
  if (!key) return "un";
  return COUNTRY_CODES[key] ?? ALIASES[key.toLowerCase()] ?? "un";
}

export function flagUrl(country: string, width = 40): string {
  const code = getCountryCode(country);
  return `https://flagcdn.com/w${width}/${code}.png`;
}
