import type { AnnotatedImage as AnnotatedImageT } from "@/db/schema";
import { Section } from "@/components/site/primitives";
import { AnnotatedImage } from "@/components/site/blocks/Blocks";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type DeviceDiagramVariant = "default";

export type DeviceDiagramData = AnnotatedImageT;

function DeviceDiagram({ data: d, edit: e, nested }: BlockProps<"deviceDiagram">) {
  if (!d.imageUrl) return null;
  const figure = <AnnotatedImage a={d} render={(j) => <F e={e} k={`markers.${j}.label`}>{d.markers[j].label}</F>} />;
  return nested ? <div className="mt-4">{figure}</div> : <Section>{figure}</Section>;
}

export const deviceDiagram: BlockDef<"deviceDiagram"> = {
  type: "deviceDiagram",
  name: "Device diagram",
  description: "Device image with numbered markers and a legend.",
  category: "content",
  nestable: true,
  variants: [{ id: "default", label: "Diagram with labels" }],
  fields: [
    { key: "imageUrl", label: "Image", kind: "media", required: true },
    { key: "caption", label: "Caption", kind: "text" },
    { key: "markers", label: "Markers: label and position on the image", kind: "items" },
  ],
  example: {
    imageUrl: "/uploads/features/tt-active-technology.jpg",
    caption: "Device overview",
    markers: [
      { x: 20, y: 40, label: "Radiopaque tip" },
      { x: 50, y: 55, label: "Adjustable mesh" },
      { x: 80, y: 45, label: "Push wire" },
    ],
  },
  Component: DeviceDiagram,
};
