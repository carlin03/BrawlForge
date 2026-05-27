/** ISO 3166-1 alpha-2 codes for real flag assets */
export const COUNTRY_CODES: Record<string, string> = {
  Japan: "jp",
  Germany: "de",
  Spain: "es",
  "United States": "us",
  Turkey: "tr",
  France: "fr",
  Brazil: "br",
  Italy: "it",
  Poland: "pl",
  Sweden: "se",
  Mexico: "mx",
  Argentina: "ar",
  "South Korea": "kr",
  Philippines: "ph",
  Indonesia: "id",
  Thailand: "th",
  Vietnam: "vn",
  "United Kingdom": "gb",
  Netherlands: "nl",
  Portugal: "pt",
};

export function getCountryCode(country: string): string {
  return COUNTRY_CODES[country] ?? "un";
}

export function flagUrl(country: string, width = 40): string {
  const code = getCountryCode(country);
  return `https://flagcdn.com/w${width}/${code}.png`;
}
