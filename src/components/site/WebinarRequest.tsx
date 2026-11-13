"use client";

/**
 * «Request this recording» on a webinar card: picks this webinar in the request form on the page and scrolls to it
 * (docs/screens/webinars.md). No server needed — works in the static demo too.
 */
export function WebinarRequest({ title }: { title: string }) {
  return (
    <button
      type="button"
      className="mt-4 text-sm font-medium underline"
      onClick={() => {
        const form = document.querySelector<HTMLFormElement>('form[data-form="webinar"]');
        const select = form?.querySelector<HTMLSelectElement>('select[name="topic"]');
        if (!form || !select) return;
        select.value = title;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        form.querySelector<HTMLInputElement>('input[name="firstName"]')?.focus({ preventScroll: true });
      }}
    >
      Request this recording
    </button>
  );
}
