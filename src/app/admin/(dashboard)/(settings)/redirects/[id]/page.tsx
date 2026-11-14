import EditResource from "../../../(content)/[resource]/[id]/page";

export default async function EditRedirect({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  return EditResource({ params: Promise.resolve({ resource: "redirects", id }), searchParams });
}
