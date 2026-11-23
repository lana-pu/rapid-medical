"use client";

/**
 * The interactive half of the UI kit (/style-guide, DESIGN.md → Примитивы): token values read from the page, and the
 * controls in every state — chips that switch, fields with an error, a window that opens.
 */
import { useEffect, useRef, useState } from "react";
import { Button, Chip, CheckboxField, Dialog, Field, FilterChips, Row, Rows, SelectField, Tag, TextAreaField } from "./ui";
import { Tabs } from "./Tabs";

/** A token: its swatch and the value it has right now (read from the CSS, so the kit never lies about it). */
export function TokenSwatch({ name, role }: { name: string; role: string }) {
  const value = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (value.current) value.current.textContent = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }, [name]);
  return (
    <div className="flex items-center gap-3">
      <span className="h-10 w-10 shrink-0 rounded border border-border" style={{ background: `var(${name})` }} aria-hidden />
      <div className="min-w-0 text-sm">
        <code>{name}</code> <span ref={value} className="text-muted" />
        <div className="text-xs text-muted">{role}</div>
      </div>
    </div>
  );
}

function Demo({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-6">
      <div className="text-sm font-semibold">{title}</div>
      {note && <p className="mt-1 max-w-2xl text-xs text-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function ComponentsKit() {
  const [product, setProduct] = useState("");
  const [on, setOn] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div>
      <Demo title="Button" note="Действие (<button>). Ссылка, похожая на кнопку, — Btn, те же классы. «Show more» везде: secondary · lg · block.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 max-w-md"><Button variant="secondary" size="lg" block>Show more</Button></div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded bg-inverse p-6 text-inverse-foreground">
          <span className="text-sm">On a dark band:</span>
          <Button onDark>Primary</Button>
          <Button onDark variant="secondary">Secondary</Button>
        </div>
      </Demo>

      <Demo title="Chip · FilterChips · Tag" note="Чип-переключатель; фильтр со счётчиками — архив Evidence, Careers, Webinars; метка — продукт в строке, источник региона.">
        <div className="flex flex-wrap items-center gap-2">
          <Chip on={on} onClick={() => setOn(!on)}>{on ? "On" : "Off"} — click</Chip>
          <Chip on={false}>Off</Chip>
        </div>
        <div className="mt-4">
          <FilterChips options={[{ id: "a", label: "PRODUCT A", count: 5 }, { id: "b", label: "PRODUCT B", count: 2 }]} total={7} value={product} onChange={setProduct} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><Tag>PRODUCT A</Tag><Tag muted>From your location</Tag></div>
      </Demo>

      <Demo title="Fields" note="Подпись над полем, * у обязательных. Ошибка — рамка и текст цветом --danger, aria-invalid; введённое остаётся.">
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <Field label="First Name*" placeholder="Empty" />
          <Field label="Email*" defaultValue="anna.levi@clinic" error="Enter a valid email" />
          <SelectField label="Region" defaultValue="Americas">
            <option>Americas</option>
            <option>Europe</option>
          </SelectField>
          <Field label="Disabled" disabled defaultValue="Not editable" />
        </div>
        <div className="mt-4 max-w-2xl space-y-4">
          <TextAreaField label="Message" rows={3} />
          <CheckboxField label="Sign me up! I would like to receive Rapid Medical news and updates." />
        </div>
      </Demo>

      <Demo title="Dialog" note="Окно поверх страницы: по центру, на телефоне во весь экран; Esc и клик по фону закрывают. Выбор региона (lg), запрос записи вебинара (md).">
        <Button variant="secondary" onClick={() => dialog.current?.showModal()}>Open a window</Button>
        <Dialog ref={dialog} labelledBy="kit-dialog-title">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-6">
              <h2 id="kit-dialog-title" className="text-xl font-semibold">Sample window</h2>
              <button type="button" onClick={() => dialog.current?.close()} className="text-sm underline">Close</button>
            </div>
            <p className="mt-4 text-sm text-muted">The content of the window: a form, a choice.</p>
          </div>
        </Dialog>
      </Demo>

      <Demo title="Tabs" note="Пилюли на десктопе, аккордеон на телефоне; underline — для вкладок внутри секции.">
        <Tabs tabs={[{ id: "one", label: "First tab", content: <p className="text-sm">First tab content.</p> }, { id: "two", label: "Second tab", content: <p className="text-sm">Second tab content.</p> }]} />
      </Demo>

      <Demo title="Rows" note="Строки материалов: левая колонка — дата (7rem), год (4rem) или картинка (10rem). Новости, события, архив Evidence, вебинары.">
        <Rows>
          <Row lead="12 Mar 2026"><a href="#rows" className="font-medium hover:underline">A sample news title</a><div className="mt-1 text-xs text-muted">News · Sample source ↗</div></Row>
          <Row lead="2025" kind="year"><span className="font-medium">A sample publication</span><div className="mt-2"><Tag>PRODUCT A</Tag></div></Row>
        </Rows>
      </Demo>
    </div>
  );
}
