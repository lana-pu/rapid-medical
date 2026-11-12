/** Requests in words (docs/screens/admin-requests.md). */
export const FORM_LABEL: Record<string, string> = { contact: "Contact form", webinar: "Webinar recording", careers: "Job application", event: "Event registration" };
export const STATUS_LABEL: Record<string, string> = { new: "New", in_progress: "In progress", done: "Done", spam: "Spam" };
export const formLabel = (f: string) => FORM_LABEL[f] ?? f;
