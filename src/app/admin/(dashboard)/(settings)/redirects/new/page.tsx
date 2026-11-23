import NewResource from "../../../(content)/[resource]/new/page";

export default function NewRedirect() {
  return NewResource({ params: Promise.resolve({ resource: "redirects" }), searchParams: Promise.resolve({}) });
}
