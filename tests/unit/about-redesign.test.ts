import { describe, it, expect } from "vitest";
import { displayCase, plainText } from "../../src/lib/text-case";
import { companyFacts } from "../../src/blocks/from-pages";
import { officeCaption, directionsUrl, type Office } from "../../src/blocks/offices-map";

/** About redesign (DESIGN.md → About, docs/screens/about-us.md). */

describe("names and positions in the usual case", () => {
  it.each([
    ["RONEN ECKHOUSE", "Ronen Eckhouse"],
    ["DR. WALID HADDAD", "Dr. Walid Haddad"],
    ["CO-FOUNDER & CEO", "Co-Founder & CEO"],
    ["PRESIDENT, AMERICAS", "President, Americas"],
    ["CO-FOUNDER AND CHAIRMAN OF THE BOARD", "Co-Founder and Chairman of the Board"],
    ["CHIEF TECHNOLOGY OFFICER", "Chief Technology Officer"],
  ])("%s → %s", (from, to) => expect(displayCase(from)).toBe(to));
  it("text typed with lower case stays as it is", () => expect(displayCase("VP of R&D, eBay")).toBe("VP of R&D, eBay"));
  it("empty stays empty", () => expect(displayCase(null)).toBe(""));
});

describe("short bio", () => {
  it("is the bio's plain text", () => expect(plainText("<p>Ronen&nbsp;is <b>CEO</b>.</p><p>He &amp; we.</p>")).toBe("Ronen is CEO . He & we."));
});

const offices: Office[] = [
  { name: "Rapid Medical Ltd.", label: "Headquarters", address: "P.O.B. 337\nCarmel building, Yokneam 2069205\nISRAEL", lat: 32.659, lon: 35.104 },
  { name: "Rapid Medical Inc.", label: "USA", address: "445 S. Kimball Ave.\nSouthlake, Texas 76092\nUSA" },
  { name: "Rapid Medical GmbH", label: "Germany", address: "Westendstrasse 21\n60325 Frankfurt\nGERMANY" },
];

describe("company facts", () => {
  it("publications counted, office countries from the addresses", () => {
    expect(companyFacts(102, offices)).toEqual([
      { label: "Clinical publications", value: "102" },
      { label: "Offices", value: "Israel · USA · Germany" },
    ]);
  });
  it("nothing to count → no rows", () => expect(companyFacts(0, [])).toEqual([]));
});

describe("office cards", () => {
  it("the headquarters caption names the country", () => {
    expect(officeCaption(offices[0])).toBe("Headquarters · Israel");
    expect(officeCaption(offices[1])).toBe("USA");
  });
  it("directions go by the pin, else by the address", () => {
    expect(directionsUrl(offices[0])).toBe("https://www.google.com/maps/dir/?api=1&destination=32.659,35.104");
    expect(directionsUrl(offices[1])).toBe("https://www.google.com/maps/dir/?api=1&destination=445%20S.%20Kimball%20Ave.%20Southlake%2C%20Texas%2076092%20USA");
    expect(directionsUrl({ name: "x" })).toBeNull();
  });
});
