export type Country = { id: number; code: string; name: string; flag: string };

// PLACEHOLDER lineup — replace with the real Asiavision 2026 participants
// before you start collecting real votes. Order here sets the default
// display order on the ballot. Restart the app after editing this.
export const COUNTRIES: Country[] = [
  { id: 1, code: "JPN", name: "Japan", flag: "🇯🇵" },
  { id: 2, code: "KOR", name: "South Korea", flag: "🇰🇷" },
  { id: 3, code: "PHL", name: "Philippines", flag: "🇵🇭" },
  { id: 4, code: "THA", name: "Thailand", flag: "🇹🇭" },
  { id: 5, code: "VNM", name: "Vietnam", flag: "🇻🇳" },
  { id: 6, code: "IDN", name: "Indonesia", flag: "🇮🇩" },
  { id: 7, code: "TWN", name: "Taiwan", flag: "🇹🇼" },
  { id: 8, code: "CHN", name: "China", flag: "🇨🇳" },
  { id: 9, code: "MYS", name: "Malaysia", flag: "🇲🇾" },
  { id: 10, code: "IND", name: "India", flag: "🇮🇳" },
  { id: 11, code: "MNG", name: "Mongolia", flag: "🇲🇳" },
];

export const COUNTRY_IDS = new Set(COUNTRIES.map((c) => c.id));
