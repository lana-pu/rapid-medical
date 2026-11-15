"use client";

import { useEffect } from "react";
import { assignRequest, markRead, startReply } from "@/admin/requests";

/** A request's live parts (docs/screens/admin-requests.md). Admin chrome: its own neutral palette. */

/** Opening a request reads it, like mail. */
export function MarkRead({ id, read }: { id: number; read: boolean }) {
  useEffect(() => {
    if (!read) void markRead(id);
  }, [id, read]);
  return null;
}

/** «Reply»: the mail program opens with the ready email; the request is marked as being answered by me. */
export function ReplyButton({ id, href }: { id: number; href: string }) {
  return (
    <a href={href} onClick={() => void startReply(id)} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
      <span aria-hidden>↩</span> Reply
    </a>
  );
}

/** Who answers — saved as soon as it is chosen. */
export function AssignSelect({ id, value, people }: { id: number; value: number | null; people: { id: number; name: string }[] }) {
  return (
    <form action={assignRequest} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`assign-${id}`} className="text-neutral-500">Who answers</label>
      <select id={`assign-${id}`} name="assignedToId" defaultValue={value ?? ""} key={value ?? ""} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm">
        <option value="">Nobody</option>
        {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </form>
  );
}
