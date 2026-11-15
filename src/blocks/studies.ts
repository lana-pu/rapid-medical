import type { StoredBlock } from "@/db/schema";
import { newBlockId } from "./stored";

/**
 * Study pages as «page from a document» (DESIGN.md → Страница из документа, Набор инфографики; decision 2026-11-15):
 * the conclusion under the title, key figures — each with the sentence it is quoted from — the passport, and the full
 * study beside its source. Values only from the documents the pages already carry: the SUCCESS poster on the page, the
 * DISTALS page text and its ESOC 2026 presentation, the Long-term outcomes article (Operative Neurosurgery 2026).
 * Until «Create from a document» exists (BACKLOG п. 8) they are typed here; afterwards they are edited on the page.
 * Applied by scripts/migrate-blocks.ts (build and e2e setup) to pages still as imported.
 */
type Study = {
  hero: { eyebrow: string; body: string };
  figures: { value: string; label: string; note: string }[];
  passport: { label: string; value: string }[];
  source: { label: string; href?: string };
  meta: { label: string; value: string }[];
  links: { label: string; href: string }[];
  /** the full document shown on the page under the text (decision 2026-11-15: the study itself, not a link) */
  pdf: { href: string; title: string; caption?: string };
};

export const STUDIES: Record<string, Study> = {
  "success-study-final-results": {
    "hero": {
      "eyebrow": "Study · COMANECI™",
      "body": "Data demonstrates a high rate of successful aneurysm occlusion when using Comaneci as an assist device in wide neck aneurysms."
    },
    "figures": [
      {
        "value": "95%",
        "label": "Successful occlusion at 6 months (Raymond Roy I and II)",
        "note": "Successful Occlusion (Raymond Roy I and II) at end of procedure was 86%, and 95% at 6 month follow up"
      },
      {
        "value": "82%",
        "label": "Good clinical outcome (mRS 0–2) at 6 months",
        "note": "good clinical outcome (mRS 0-2) was 73% at baseline, 80% at 30 days follow up and 82% at 6 months follow up"
      },
      {
        "value": "0",
        "label": "Symptomatic thromboembolic events",
        "note": "Intraoperative thromboembolic events were reported in 5 subjects (5.5%), none were symptomatic"
      },
      {
        "value": "0.3%",
        "label": "Coil entanglement",
        "note": "coil entanglement occurred for 1 coil out of the overall 356 coils (0.3%)"
      }
    ],
    "passport": [
      {
        "label": "Design",
        "value": "Multicenter, single arm, open, prospective study"
      },
      {
        "label": "Regulation",
        "value": "FDA-regulated post-market study"
      },
      {
        "label": "Patients",
        "value": "90 consecutive subjects"
      },
      {
        "label": "Centers",
        "value": "17 US centers"
      },
      {
        "label": "Enrollment",
        "value": "November 2020 – October 2023"
      },
      {
        "label": "Imaging",
        "value": "Independent imaging core lab (UCLA)"
      },
      {
        "label": "Study management",
        "value": "Vastrax, Inc. (CRO)"
      }
    ],
    "source": {
      "label": "SUCCESS study poster (Davies JM et al.), below"
    },
    "meta": [
      {
        "label": "Product",
        "value": "COMANECI™"
      }
    ],
    "links": [
      {
        "label": "Full article — JNIS (PDF)",
        "href": "/uploads/duda/Comaneci-SUCCESS-jnis-2025-cc289e.pdf"
      }
    ],
    "pdf": {"href": "/uploads/duda/Comaneci-SUCCESS-jnis-2025-cc289e.pdf", "title": "SUCCESS — full article", "caption": "Full article as published in the Journal of NeuroInterventional Surgery (JNIS)."}
  },
  "distals-results": {
    "hero": {
      "eyebrow": "Study · TIGERTRIEVER™ 13",
      "body": "DISTALS results mark a turning point in MVO—showing TIGERTRIEVER™ 13 restores blood flow safely, with a consistent trend toward better outcomes, expanding what’s possible for nearly 50% of ischemic stroke patients."
    },
    "figures": [
      {
        "value": "3x",
        "label": "Improvement in successful reperfusion",
        "note": "TIGERTRIEVER™ 13 delivered 3x improvement in successful reperfusion without symptomatic intracranial hemorrhage (sICH) events."
      },
      {
        "value": "2x",
        "label": "More patients reported perfect health (EQ-5D)",
        "note": "2x more patients reported perfect health on a patient-reported quality of life survey (EQ-5D)"
      },
      {
        "value": "~50%",
        "label": "Of ischemic stroke patients — MVO",
        "note": "expanding what’s possible for nearly 50% of ischemic stroke patients"
      }
    ],
    "passport": [
      {
        "label": "Design",
        "value": "US and EU, multi-center, prospective, randomized, blinded (endpoint), controlled, IDE study"
      },
      {
        "label": "Randomization",
        "value": "1:1"
      },
      {
        "label": "Treatment",
        "value": "Medical Management + Tigertriever 13"
      },
      {
        "label": "Control",
        "value": "Medical Management"
      },
      {
        "label": "Sample size",
        "value": "118 randomized patients in up to 25 total centers"
      },
      {
        "label": "Oversight",
        "value": "Independent imaging core lab and strict oversight"
      }
    ],
    "source": {
      "label": "Final Results of the DISTALS Randomized Trial — ESOC, May 2026 (PDF)",
      "href": "/uploads/duda/DISTALS-ESOC-May-2026-for-web-a86bcf.pdf"
    },
    "meta": [
      {
        "label": "Product",
        "value": "TIGERTRIEVER™ 13"
      }
    ],
    "links": [
      {
        "label": "Results presentation — ESOC 2026 (PDF)",
        "href": "/uploads/duda/DISTALS-ESOC-May-2026-for-web-a86bcf.pdf"
      }
    ],
    "pdf": {"href": "/uploads/duda/DISTALS-ESOC-May-2026-for-web-a86bcf.pdf", "title": "DISTALS — final results, ESOC 2026", "caption": "Final Results of the DISTALS Randomized Trial — presentation, ESOC, May 2026."}
  },
  "LongTerm_Outcomes": {
    "hero": {
      "eyebrow": "Study · COMANECI™",
      "body": "The use of the Comaneci device has a low risk of complications in endovascular treatment of IAs, without procedure-related morbidity and mortality."
    },
    "figures": [
      {
        "value": "97",
        "label": "Of 100 aneurysm necks bridged successfully",
        "note": "In 97 cases, bridging an aneurysmal neck was successful."
      },
      {
        "value": "90",
        "label": "Patients with adequate occlusion at 18 months (Raymond-Roy 1 + 2)",
        "note": "At 18 months postprocedure, adequate occlusion (Raymond-Roy 1 + 2) was in 90 patients."
      },
      {
        "value": "All",
        "label": "Cases with the device successfully deployed",
        "note": "The Comaneci device was successfully deployed in all cases."
      }
    ],
    "passport": [
      {
        "label": "Patients",
        "value": "100 consecutive patients with incidental compressive and ruptured IAs"
      },
      {
        "label": "Inclusion",
        "value": "Wide-neck aneurysm: neck width ≥4 mm or a dome-to-neck ratio of <2"
      },
      {
        "label": "Devices",
        "value": "Comaneci (n = 35), Comaneci 17 (n = 60), Comaneci Petit (n = 5)"
      },
      {
        "label": "Follow-up",
        "value": "3 and 6 months, 1 year, and 18 months; modified Raymond-Roy classification"
      },
      {
        "label": "Center",
        "value": "Department of Neurosurgery, Brodnowski Masovian Hospital, Warsaw, Poland"
      },
      {
        "label": "Journal",
        "value": "Operative Neurosurgery, 2026"
      }
    ],
    "source": {
      "label": "Onikijuk J et al., Operative Neurosurgery 2026",
      "href": "https://doi.org/10.1227/ons.0000000000001932"
    },
    "meta": [
      {
        "label": "Product",
        "value": "COMANECI™"
      },
      {
        "label": "Published",
        "value": "February 4, 2026"
      }
    ],
    "links": [
      {
        "label": "Download PDF",
        "href": "/uploads/duda/long_term_outcomes_of_temporary_stent_assisted.1879-b5ad13.pdf"
      },
      {
        "label": "Open the original ↗",
        "href": "https://doi.org/10.1227/ons.0000000000001932"
      }
    ],
    "pdf": {"href": "/uploads/duda/long_term_outcomes_of_temporary_stent_assisted.1879-b5ad13.pdf", "title": "Long-term outcomes — full article", "caption": "Onikijuk J et al., Operative Neurosurgery 2026."}
  }
};

/**
 * A study page still as imported (a title and one text block) → «Study · product» and the conclusion over the title,
 * key figures, passport, the text as a document with its source. Anything else (already edited) → null, left alone.
 */
export function studyPageBlocks(slug: string, blocks: StoredBlock[] | null | undefined): StoredBlock[] | null {
  const s = Object.hasOwn(STUDIES, slug) ? STUDIES[slug] : null;
  if (!s || !blocks || blocks.length !== 2 || blocks[0].type !== "hero" || blocks[1].type !== "richText") return null;
  // the region label source would replace «Study · product»; the region is in the header
  const hero: StoredBlock = { ...blocks[0], data: { ...blocks[0].data, ...s.hero } };
  delete hero.source;
  return [
    hero,
    { id: newBlockId(), type: "keyNumbers", variant: "figures", data: { items: s.figures } },
    { id: newBlockId(), type: "passport", variant: "default", data: { title: "Study at a glance", rows: s.passport, source: s.source } },
    { ...blocks[1], variant: "document", data: { ...blocks[1].data, meta: s.meta, links: s.links, pdf: s.pdf } },
  ];
}
