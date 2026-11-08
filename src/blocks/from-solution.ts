import type { Region, Solution } from "@/db/schema";
import { REGION_SHORT } from "@/lib/regions";
import type { EditBinding } from "./bind";
import type { BlockGroup, DetailsTab } from "./product-details";
import type { Block, BlockOf } from "./types";

/**
 * Therapy page as a block list, built from the fields of a `solutions` row.
 * Storage stays as it is until pages are stored as block lists (ADR-006);
 * `edit` bindings point at the same record paths as before, so the on-page
 * editor and the admin form keep writing to the same fields.
 * Order and rules: docs/screens/therapy.md → «Блоки».
 */
export type SolutionForBlocks = Solution & { product?: { slug: string } | null };

export function solutionToBlocks(s: SolutionForBlocks, ctx: { region: Region; others: Region[] }): Block[] {
  const { region, others } = ctx;
  const bind = (map: Record<string, string | null>, prefix?: string): EditBinding => ({ r: "solutions", id: s.id, map, prefix });
  const blocks: Block[] = [];

  blocks.push({
    type: "hero",
    variant: s.heroVideoUrl ? "video" : "image",
    data: {
      eyebrow: s.breadcrumb || `Our solutions / ${s.navLabel}`,
      eyebrowLinks: others.map((o) => ({ label: `${REGION_SHORT[o]} version`, href: `/${o}/therapies/${s.slug}` })),
      title: s.heroTitle,
      body: s.heroBody,
      cta: s.heroCta,
      imageUrl: s.heroImageUrl,
      videoUrl: s.heroVideoUrl,
    },
    edit: bind({ title: "heroTitle", body: "heroBody", cta: "heroCta", imageUrl: "heroImageUrl", videoUrl: "heroVideoUrl" }),
  });

  if (s.introTitle || s.introBody || s.introVideoUrl || s.introImageUrl) {
    blocks.push({
      type: "text",
      variant: "lead",
      data: { title: s.introTitle, body: s.introBody, imageUrl: s.introImageUrl, videoUrl: s.introVideoUrl },
      edit: bind({ title: "introTitle", body: "introBody", imageUrl: "introImageUrl", videoUrl: "introVideoUrl" }),
    });
  }

  s.benefits.forEach((b, i) => {
    blocks.push({
      type: "textMedia",
      variant: b.secondaryImageUrl ? "threeColumn" : i % 2 ? "mediaLeft" : "mediaRight",
      data: b,
      edit: bind({}, `benefits.${i}.`),
    });
  });

  const actions: BlockOf<"cta"> = {
    type: "cta",
    variant: "buttons",
    data: { buttons: s.actionLinks, note: s.actionNote },
    edit: bind({ buttons: "actionLinks", note: "actionNote" }),
  };

  const overview: (Block | BlockGroup)[] = [
    { type: "text", variant: "default", data: { body: s.overviewBody }, edit: bind({ body: "overviewBody" }) },
    {
      type: "columns",
      variant: "features",
      data: { items: s.overviewFeatures, legacyImageUrl: s.overviewImageUrl },
      edit: bind({ items: "overviewFeatures", legacyImageUrl: "overviewImageUrl" }),
    },
  ];
  const annotated = s.annotatedImage?.imageUrl ? s.annotatedImage : null;
  const hasTable = !!s.specs && s.specs.columns.length > 0;
  if (annotated || hasTable || s.specImageUrls.length > 0) {
    const spec: Block[] = [];
    if (annotated) spec.push({ type: "deviceDiagram", variant: "default", data: annotated, edit: bind({ markers: "annotatedImage.markers" }) });
    spec.push(
      hasTable
        ? { type: "specTable", variant: "table", data: { table: s.specs, note: s.specs?.note || s.specNote } }
        : {
            type: "specTable",
            variant: "images",
            data: { images: s.specImageUrls.filter((u) => !annotated || u !== annotated.imageUrl), note: s.specNote },
            edit: bind({ images: "specImageUrls", note: "specNote" }),
          },
    );
    overview.push({ group: "Specifications", blocks: spec });
  }
  overview.push(actions);

  const tabs: DetailsTab[] = [{ id: "overview", label: "Product overview", title: s.overviewTitle || "Product overview", blocks: overview }];
  if (s.howItWorks.length) {
    tabs.push({
      id: "how",
      label: "How it works",
      title: "How it works",
      blocks: [{ type: "columns", variant: "steps", data: { items: s.howItWorks }, edit: bind({ items: "howItWorks" }) }, actions],
    });
  }
  if (s.inPractice.length || s.webinarCtaEnabled) {
    const practice: Block[] = [];
    if (s.webinarCtaEnabled) {
      practice.push({
        type: "cta",
        variant: "panel",
        data: {
          title: "Webinars",
          body: "Physician-led webinars are available to view on-demand. To watch a recording, please submit a request.",
          buttons: [{ label: "Request to view", href: `/${region}/webinars` }],
        },
      });
    }
    practice.push({ type: "people", variant: "physicians", data: { items: s.inPractice }, edit: bind({ items: "inPractice" }) }, actions);
    tabs.push({ id: "practice", label: "In-Practice", title: "In practice", blocks: practice });
  }
  tabs.push({ id: "evidence", label: "Clinical evidence", href: `/${region}/evidence#${s.product?.slug ?? "browse-by-product"}`, blocks: [] });

  blocks.push({ type: "productDetails", variant: "pills", data: { anchor: "overview", hint: "Click on a tab below to learn more.", tabs } });

  if (s.closingTitle || s.closingEmbedUrl) {
    blocks.push({ type: "video", variant: "band", data: { title: s.closingTitle, url: s.closingEmbedUrl }, edit: bind({ title: "closingTitle" }) });
  }

  if (s.closingBody) {
    blocks.push({
      type: "cta",
      variant: "band",
      data: { title: "Questions?", body: s.closingBody.replace(/^questions\?\s*/i, ""), buttons: [{ label: "Contact us", href: `/contact-us?region=${region}` }] },
      edit: bind({ body: "closingBody" }),
    });
  }

  if (s.regulatoryHtml || s.referencesHtml) {
    blocks.push({
      type: "indications",
      variant: "default",
      data: { indicationsHtml: s.regulatoryHtml, referencesHtml: s.referencesHtml },
      edit: bind({ indicationsHtml: "regulatoryHtml", referencesHtml: "referencesHtml" }),
    });
  }

  return blocks;
}
