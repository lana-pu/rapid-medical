/** how documents name countries → the names of the map (world-atlas) */
const ALIASES = new Map<string, string>(Object.entries({
  usa: "United States of America", us: "United States of America", "united states": "United States of America", america: "United States of America",
  uk: "United Kingdom", england: "United Kingdom", scotland: "United Kingdom", "great britain": "United Kingdom",
  "czech republic": "Czechia", korea: "South Korea", "republic of korea": "South Korea", "russian federation": "Russia",
  "the netherlands": "Netherlands", holland: "Netherlands", "viet nam": "Vietnam", "türkiye": "Turkey", turkiye: "Turkey",
  uae: "United Arab Emirates", "bosnia and herzegovina": "Bosnia and Herz.", "north macedonia": "Macedonia",
}));
/** a Map, not an object: a name like «constructor» is not looked up on the prototype */
export const mapCountry = (name: string) => ALIASES.get(name.trim().toLowerCase()) ?? name.trim();
