"use client";

import { deleteDraftRecordAction } from "@/admin/actions";
import { Button } from "./ui";

/** «Delete draft» on a record that is not on the site; asks first, like Delete in the list. */
export function DeleteDraftButton({ resourceSlug, id, label }: { resourceSlug: string; id: number; label: string }) {
  return (
    <form action={deleteDraftRecordAction}>
      <input type="hidden" name="__resource" value={resourceSlug} />
      <input type="hidden" name="__id" value={id} />
      <Button type="submit" variant="danger" onClick={(e) => { if (!window.confirm(`Delete «${label}»? This cannot be undone.`)) e.preventDefault(); }}>
        Delete draft
      </Button>
    </form>
  );
}
