import { describe, it, expect } from "vitest";
import { findCountries, regionCountryNames } from "../../src/lib/countries";
import { regionForCountry, REGION_COUNTRY_CODES } from "../../src/lib/regions";
import { regionTargets } from "../../src/components/site/RegionModal";
import { regionSource } from "../../src/lib/region-cookie";

/** The region chooser window (DESIGN.md → Выбор региона, docs/screens/choose-your-location.md). */

describe("countries under each region come from the IP table", () => {
  it("main markets first; Europe & Middle East is all the others", () => {
    expect(regionCountryNames("us")!.slice(0, 3)).toEqual(["United States", "Canada", "Mexico"]);
    expect(regionCountryNames("us")).toHaveLength(REGION_COUNTRY_CODES.us.length);
    expect(regionCountryNames("apac")!.slice(0, 2)).toEqual(["China", "Japan"]);
    expect(regionCountryNames("ous")).toBeNull();
  });
});

describe("Find your country", () => {
  it("names starting with the text first, accents ignored; its region is the IP region", () => {
    const [uae] = findCountries("united arab");
    expect(uae).toEqual({ code: "AE", name: "United Arab Emirates" });
    expect(regionForCountry(uae.code)).toBe("apac");
    expect(findCountries("cote")[0].code).toBe("CI");
    expect(findCountries("zealand").map((c) => c.code)).toEqual(["NZ"]); // contains, when nothing starts with it
    expect(findCountries("in")[0].code).toBe("IN"); // starting with it comes first
    expect(findCountries("b")).toEqual([]); // two letters at least
  });
});

describe("where the buttons lead", () => {
  it("from the header: back to the same page in the chosen region", () => {
    expect(regionTargets({ back: "/us/therapies/lvo#product" }).find((o) => o.region === "ous")!.href).toBe("/api/region?to=ous&back=%2Fus%2Ftherapies%2Flvo%23product");
  });
  it("with the region unknown: on to the section asked for", () => {
    expect(regionTargets({ next: "evidence" }).map((o) => o.href)).toEqual([
      "/api/region?to=us&back=%2Fus%2Fevidence", "/api/region?to=apac&back=%2Fapac%2Fevidence", "/api/region?to=ous&back=%2Fous%2Fevidence",
    ]);
    expect(regionTargets({ next: "../x" })[0].href).toBe("/api/region?to=us&back=%2Fus%2Ftherapies");
  });
});

describe("where the current region came from", () => {
  it("own choice, the IP, or unknown", () => {
    expect(regionSource("us", "ous", "1")).toBe("chosen");
    expect(regionSource("us", "us", undefined)).toBe("location");
    expect(regionSource("us", null, undefined)).toBeNull();
  });
});
