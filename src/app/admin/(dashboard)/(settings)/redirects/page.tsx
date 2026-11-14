import ResourceList from "../../(content)/[resource]/page";

/** Redirects live in Settings (docs/admin-ia.md): the generic list, without the site tree. */
export default function Redirects({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return ResourceList({ params: Promise.resolve({ resource: "redirects" }), searchParams });
}
