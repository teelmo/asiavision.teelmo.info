export type Country = { id: number; code: string; name: string; flag: string };

// Eurovision Song Contest Asia 2026 lineup (Bangkok, Thailand, 14 Nov 2026).
// Source: https://en.wikipedia.org/wiki/Eurovision_Song_Contest_Asia
// Order here sets the default display order on the ballot. Restart the
// app after editing this.
export const COUNTRIES: Country[] = [
  { id: 1, code: "BGD", name: "Bangladesh", flag: "🇧🇩" },
  { id: 2, code: "BTN", name: "Bhutan", flag: "🇧🇹" },
  { id: 3, code: "KHM", name: "Cambodia", flag: "🇰🇭" },
  { id: 4, code: "LAO", name: "Laos", flag: "🇱🇦" },
  { id: 5, code: "MYS", name: "Malaysia", flag: "🇲🇾" },
  { id: 6, code: "MNG", name: "Mongolia", flag: "🇲🇳" },
  { id: 7, code: "NPL", name: "Nepal", flag: "🇳🇵" },
  { id: 8, code: "PHL", name: "Philippines", flag: "🇵🇭" },
  { id: 9, code: "KOR", name: "South Korea", flag: "🇰🇷" },
  { id: 10, code: "THA", name: "Thailand", flag: "🇹🇭" },
  { id: 11, code: "VNM", name: "Vietnam", flag: "🇻🇳" },
];

export const COUNTRY_IDS = new Set(COUNTRIES.map((c) => c.id));
