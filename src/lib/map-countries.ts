/** how documents name countries → the names of the map (world-atlas) */
const ALIASES: Record<string, string> = {
  usa: "United States of America", us: "United States of America", "united states": "United States of America", america: "United States of America",
  uk: "United Kingdom", england: "United Kingdom", scotland: "United Kingdom", "great britain": "United Kingdom",
  "czech republic": "Czechia", korea: "South Korea", "republic of korea": "South Korea", "russian federation": "Russia",
  "the netherlands": "Netherlands", holland: "Netherlands", "viet nam": "Vietnam", "türkiye": "Turkey", turkiye: "Turkey",
  uae: "United Arab Emirates", "bosnia and herzegovina": "Bosnia and Herz.", "north macedonia": "Macedonia",
};
export const mapCountry = (name: string) => ALIASES[name.trim().toLowerCase()] ?? name.trim();
