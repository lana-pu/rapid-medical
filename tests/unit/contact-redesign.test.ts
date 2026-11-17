import { describe, expect, it } from "vitest";
import { countryName, countryOptions, formRegionForCountry, isCountryCode, COUNTRIES_WITH_STATE } from "@/lib/countries";
import { contactToBlocks } from "@/blocks/from-pages";

const offices = [
  { name: "Rapid Medical Ltd.", label: "Headquarters", phone: "+972-72-250-3331", ordersEmail: "customerservice.ltd@rapid-medical.com" },
  { name: "Rapid Medical Inc.", label: "USA", phone: "+1-469-991-7712", ordersEmail: "orders.inc@rapid-medical.com" },
];

describe("contact form countries (docs/screens/contact-us.md)", () => {
  it("names countries and lists them by name", () => {
    expect(countryName("US")).toBe("United States");
    expect(isCountryCode("DE")).toBe(true);
    expect(isCountryCode("ZZ")).toBe(false);
    const names = countryOptions().map((o) => o.name);
    expect(names[0]).toBe("Afghanistan");
    expect(names.indexOf("Åland Islands")).toBe(names.indexOf("Afghanistan") + 1);
  });
  it("derives the mail region from the country — the same table as the IP region", () => {
    expect(formRegionForCountry("US")).toBe("Americas");
    expect(formRegionForCountry("BR")).toBe("Americas");
    expect(formRegionForCountry("DE")).toBe("Europe");
    expect(formRegionForCountry("JP")).toBe("Asia Pacific");
  });
  it("asks for a state only in the US and Canada", () => {
    expect(COUNTRIES_WITH_STATE).toEqual(["US", "CA"]);
  });
});

describe("contactToBlocks", () => {
  it("puts the form beside the region's contacts", () => {
    const [, form] = contactToBlocks({ region: "us", topic: "demo", country: "US", offices });
    expect(form.variant).toBe("split");
    const d = form.data as { contacts: { label: string; value: string; href?: string }[]; defaultTopic?: string; defaultCountry?: string };
    expect(d.defaultTopic).toBe("Request a demo");
    expect(d.defaultCountry).toBe("US");
    expect(d.contacts[0]).toEqual({ label: "Call Americas", value: "+1-469-991-7712", href: "tel:+14699917712" });
    expect(d.contacts[1].value).toBe("orders.inc@rapid-medical.com");
  });
  it("uses headquarters outside the Americas and shows nothing without offices", () => {
    const d = contactToBlocks({ region: "ous", offices })[1].data as { contacts: { label: string }[] };
    expect(d.contacts[0].label).toBe("Call headquarters");
    const none = contactToBlocks({})[1].data as { contacts: unknown[]; contactsLink: unknown };
    expect(none.contacts).toEqual([]);
    expect(none.contactsLink).toBeNull();
  });
});
