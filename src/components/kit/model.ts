/**
 * The blocks sandbox (/lab/blocks): the proposed block model before it goes into the editor
 * (proposal 2026-11-23, https://claude.ai/artifact/MQ3VnznddkqttLixZZCkEY). A page is a list of sections; a section has
 * a background and a column layout; each column holds base blocks; every block has switchable options (its variants);
 * Tabs hold blocks again. Ready sections are named combinations the editor adds. Nothing here is stored on the server.
 */

export type Opt = { key: string; label: string; values: { id: string; label: string }[] };
export type Block = { id: string; type: BlockType; o: Record<string, string>; d: Record<string, unknown> };
export type Section = { id: string; bg: string; layout: string; valign: string; space: string; cols: Block[][] };
export type BlockType = "heading" | "text" | "buttons" | "media" | "numbers" | "cards" | "facts" | "quote" | "list" | "tabs";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const SECTION_OPTS: Opt[] = [
  { key: "bg", label: "Фон", values: [{ id: "white", label: "Белый" }, { id: "grey", label: "Серый" }, { id: "dark", label: "Тёмный" }, { id: "image", label: "Картинка" }] },
  { key: "layout", label: "Колонки", values: [{ id: "1", label: "1" }, { id: "1-1", label: "½ + ½" }, { id: "2-1", label: "⅔ + ⅓" }, { id: "1-2", label: "⅓ + ⅔" }, { id: "1-1-1", label: "⅓ ⅓ ⅓" }] },
  { key: "valign", label: "По высоте", values: [{ id: "top", label: "Сверху" }, { id: "center", label: "По центру" }] },
  { key: "space", label: "Отступы", values: [{ id: "normal", label: "Обычные" }, { id: "large", label: "Крупные" }] },
];
export const colCount = (layout: string) => layout.split("-").length;

const v = (...pairs: [string, string][]) => pairs.map(([id, label]) => ({ id, label }));
const ALIGN: Opt = { key: "align", label: "Выравнивание", values: v(["left", "Слева"], ["center", "По центру"]) };

export const BLOCK_DEFS: Record<BlockType, { name: string; hint: string; opts: Opt[]; nestable: boolean; make: () => Pick<Block, "o" | "d"> }> = {
  heading: {
    name: "Заголовок", hint: "надзаголовок, заголовок, подзаголовок", nestable: true,
    opts: [{ key: "level", label: "Уровень", values: v(["h1", "H1 страницы"], ["h2", "H2 секции"], ["h3", "H3"]) }, { key: "eyebrow", label: "Надзаголовок", values: v(["on", "Есть"], ["off", "Нет"]) }, { key: "rule", label: "Линия", values: v(["off", "Нет"], ["below", "Снизу"], ["above", "Сверху"]) }, ALIGN],
    make: () => ({ o: { level: "h2", eyebrow: "on", rule: "off", align: "left" }, d: { eyebrow: "Large vessel stroke", title: "Gain active control", sub: "" } }),
  },
  text: {
    name: "Текст", hint: "абзацы текста", nestable: true,
    opts: [{ key: "size", label: "Размер", values: v(["normal", "Обычный"], ["lead", "Вводный"], ["large", "Крупный"], ["small", "Мелкий"]) }, { key: "cols", label: "Колонки", values: v(["1", "1"], ["2", "2"]) }, ALIGN],
    make: () => ({ o: { size: "normal", cols: "1", align: "left" }, d: { body: "The only clot retriever equipped with real-time adjustability – accelerates clot integration and removes tension on the vessel." } }),
  },
  buttons: {
    name: "Кнопки", hint: "одна или несколько кнопок", nestable: true,
    opts: [{ key: "count", label: "Сколько", values: v(["1", "1"], ["2", "2"], ["3", "3"]) }, { key: "style", label: "Вид", values: v(["button", "Кнопки"], ["outline", "Контур"], ["link", "Ссылки"]) }, ALIGN],
    make: () => ({ o: { count: "2", style: "button", align: "left" }, d: { items: ["Request a demo", "Customer support", "Clinical evidence"] } }),
  },
  media: {
    name: "Медиа", hint: "картинка, видео или документ", nestable: true,
    opts: [{ key: "kind", label: "Тип", values: v(["image", "Картинка"], ["video", "Видео"], ["document", "Документ"]) }, { key: "ratio", label: "Формат", values: v(["wide", "16:9"], ["photo", "4:3"], ["square", "1:1"], ["pano", "21:9"]) }, { key: "caption", label: "Подпись", values: v(["off", "Нет"], ["on", "Есть"]) }],
    make: () => ({ o: { kind: "image", ratio: "wide", caption: "off" }, d: { src: 0, caption: "TIGERTRIEVER™ in a vessel model." } }),
  },
  numbers: {
    name: "Цифры", hint: "ключевые цифры, инфографика", nestable: true,
    opts: [{ key: "count", label: "Сколько", values: v(["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]) }, { key: "style", label: "Вид", values: v(["big", "Крупные"], ["circles", "Круги"], ["line", "С линией"], ["badge", "Плашка"]) }, ALIGN],
    make: () => ({ o: { count: "3", style: "big", align: "left" }, d: { items: [{ value: "47%", label: "FPE", note: "mTICI ≥2b" }, { value: "0%", label: "ENT", note: "TIGER trial" }, { value: "95%", label: "Final recanalization", note: "mTICI ≥2b" }, { value: "102", label: "Clinical publications", note: "" }] } }),
  },
  cards: {
    name: "Карточки", hint: "колонки, шаги, преимущества, ссылки", nestable: true,
    opts: [{ key: "count", label: "Сколько", values: v(["2", "2"], ["3", "3"], ["4", "4"]) }, { key: "style", label: "Вид", values: v(["plain", "Текст"], ["steps", "Шаги"], ["image", "С картинкой"], ["link", "Ссылки"]) }, { key: "frame", label: "Рамка", values: v(["off", "Нет"], ["line", "Линия сверху"], ["box", "Карточка"]) }],
    make: () => ({ o: { count: "3", style: "plain", frame: "line" }, d: { items: [
      { title: "Reinforced distal protection", body: "Distal Embolic Net helps protect against distal emboli and provides the lowest ENT rate of any mechanical thrombectomy trial (2.6%)." },
      { title: "Proprietary active technology", body: "The only clot retriever equipped with real-time adjustability – accelerates clot integration and removes tension on the vessel." },
      { title: "Small microcatheter compatibility", body: "Lower profile microcatheter compatibility and lower delivery forces." },
      { title: "Non-occlusive design", body: "Unique braiding technology prevents flow disruption during the coiling procedure." },
    ] } }),
  },
  facts: {
    name: "Факты", hint: "«ключ — значение»: паспорт, контакты, факты", nestable: true,
    opts: [{ key: "rows", label: "Строк", values: v(["3", "3"], ["4", "4"], ["5", "5"]) }, { key: "layout", label: "Подписи", values: v(["side", "Слева"], ["top", "Сверху"]) }],
    make: () => ({ o: { rows: "4", layout: "side" }, d: { rows: [["Headquarters", "Yokneam, Israel"], ["Founded", "2011"], ["Countries", "30+"], ["Clinical publications", "102"], ["Offices", "Israel · USA · Germany"]] } }),
  },
  quote: {
    name: "Цитата", hint: "цитата врача или сотрудника", nestable: true,
    opts: [{ key: "photo", label: "Фото", values: v(["on", "Есть"], ["off", "Нет"]) }, { key: "size", label: "Размер", values: v(["normal", "Обычный"], ["large", "Крупный"]) }],
    make: () => ({ o: { photo: "on", size: "normal" }, d: { text: "The adjustability lets me match the device to the vessel instead of the other way round.", who: "Interventional neuroradiologist", src: 1 } }),
  },
  list: {
    name: "Список", hint: "новости, публикации, вебинары, вакансии — из записей", nestable: true,
    opts: [{ key: "source", label: "Что", values: v(["news", "Новости"], ["publications", "Публикации"], ["webinars", "Вебинары"], ["jobs", "Вакансии"]) }, { key: "view", label: "Вид", values: v(["cards", "Карточки"], ["rows", "Строки"], ["featured", "Первая крупно"]) }, { key: "count", label: "Сколько", values: v(["3", "3"], ["4", "4"], ["6", "6"]) }],
    make: () => ({ o: { source: "news", view: "cards", count: "3" }, d: {} }),
  },
  tabs: {
    name: "Вкладки", hint: "вкладки, внутри — блоки", nestable: false,
    opts: [{ key: "style", label: "Вид", values: v(["pills", "Пилюли"], ["underline", "Подчёркивание"]) }],
    make: () => ({ o: { style: "pills" }, d: { tabs: [{ label: "Product overview", blocks: [] }, { label: "Specifications", blocks: [] }, { label: "Clinical evidence", blocks: [] }] } }),
  },
};

export function newBlock(type: BlockType, o: Record<string, string> = {}, d: Record<string, unknown> = {}): Block {
  const m = BLOCK_DEFS[type].make();
  return { id: uid(), type, o: { ...m.o, ...o }, d: { ...m.d, ...d } };
}

const b = newBlock;
const sec = (bg: string, layout: string, cols: Block[][], extra: Partial<Section> = {}): Section => ({ id: uid(), bg, layout, valign: "center", space: "normal", cols, ...extra });

/** Ready sections: what the editor adds. `was` — the block the site uses today. */
export type Ready = { key: string; name: string; was: string; make: () => Section };
export const READY: Ready[] = [
  { key: "hero-image", name: "Первый экран с картинкой", was: "Hero · image", make: () => sec("dark", "1-1", [[b("heading", { level: "h1", eyebrow: "on" }, { title: "A patient-centric approach to AIS", eyebrow: "Therapies / Large vessel stroke" }), b("text", { size: "lead" }, { body: "TIGERTRIEVER™ is the only active thrombectomy device – it is engineered to adapt to patient anatomy." }), b("buttons", { count: "1" })], [b("media")]], { space: "large" }) },
  { key: "hero-banner", name: "Баннер на всю ширину", was: "Hero · banner", make: () => sec("image", "1", [[b("heading", { level: "h1", eyebrow: "off", align: "center" }, { title: "Purpose-built devices for stroke intervention" }), b("text", { size: "lead", align: "center" }, { body: "Personalized tools for patient anatomy." }), b("buttons", { count: "2", align: "center" }, { items: ["Our therapies", "Clinical evidence", ""] })]], { space: "large" }) },
  { key: "page-title", name: "Заголовок страницы", was: "Hero · page, title", make: () => sec("white", "1", [[b("heading", { level: "h1", eyebrow: "off", rule: "below" }, { title: "News & Events" })]]) },
  { key: "text", name: "Текст", was: "Text · default, lead, large", make: () => sec("white", "1", [[b("heading", { eyebrow: "off" }, { title: "Why active control matters" }), b("text", { size: "lead" })]]) },
  { key: "text-media", name: "Текст и картинка", was: "Text and media · mediaRight / mediaLeft", make: () => sec("grey", "1-1", [[b("heading"), b("text"), b("buttons", { count: "1", style: "link" })], [b("media")]]) },
  { key: "text-numbers", name: "Текст и цифры", was: "Text and media + Key numbers · circles", make: () => sec("grey", "1-1", [[b("heading", {}, { title: "Proven first-pass effect" }), b("text")], [b("numbers", { count: "2", style: "circles", align: "center" })]]) },
  { key: "numbers", name: "Ключевые цифры", was: "Key numbers · figures / row", make: () => sec("white", "1", [[b("heading", { eyebrow: "off", align: "center" }, { title: "TIGER trial results" }), b("numbers", { count: "3", align: "center" })]]) },
  { key: "steps", name: "Шаги", was: "Columns · steps", make: () => sec("white", "1", [[b("heading", { eyebrow: "off" }, { title: "How it works" }), b("cards", { style: "steps", count: "3", frame: "off" }, { items: [{ title: "Deploy", body: "Position the device across the clot under fluoroscopy." }, { title: "Adjust", body: "Expand the cage to match the vessel and integrate the clot." }, { title: "Retrieve", body: "Withdraw with the clot captured; the net protects distally." }, { title: "Confirm", body: "Check recanalization with angiography." }] })]]) },
  { key: "features", name: "Преимущества", was: "Columns · features", make: () => sec("white", "1", [[b("heading", { eyebrow: "off" }, { title: "Designed for control" }), b("cards", { count: "4", frame: "line" })]]) },
  { key: "link-cards", name: "Карточки-ссылки", was: "Columns · cards", make: () => sec("white", "1", [[b("heading", { eyebrow: "on" }, { eyebrow: "Ischemic stroke", title: "Therapies" }), b("cards", { style: "link", count: "3", frame: "box" })]]) },
  { key: "facts-text", name: "Факты и текст", was: "Text · facts", make: () => sec("white", "1-2", [[b("facts")], [b("heading", { eyebrow: "off", level: "h3" }, { title: "About Rapid Medical" }), b("text")]], { valign: "top" }) },
  { key: "quote", name: "Цитата", was: "Gallery · quotes", make: () => sec("grey", "1", [[b("quote", { size: "large" })]]) },
  { key: "cta", name: "Призыв к действию", was: "Call to action · band", make: () => sec("dark", "1", [[b("heading", { eyebrow: "off", align: "center" }, { title: "Questions?" }), b("text", { align: "center" }, { body: "Our team will get back to you within one business day." }), b("buttons", { count: "2", align: "center" })]]) },
  { key: "tabs", name: "Вкладки продукта", was: "Product details · pills", make: () => sec("white", "1", [[b("tabs", {}, { tabs: [
    { label: "Product overview", blocks: [b("heading", { eyebrow: "off", level: "h3" }, { title: "Product overview" }), b("text"), b("numbers", { count: "2", style: "line" })] },
    { label: "Specifications", blocks: [b("facts", { rows: "3" }, { rows: [["Working length", "180 cm"], ["Cage length", "21 / 32 mm"], ["Microcatheter", "0.021″"]] })] },
    { label: "Clinical evidence", blocks: [b("list", { source: "publications", view: "rows", count: "3" })] },
  ] })]]) },
  { key: "news", name: "Новости", was: "News · cards", make: () => sec("white", "1", [[b("heading", { eyebrow: "off" }, { title: "Latest news" }), b("list", { source: "news", view: "cards", count: "3" })]]) },
  { key: "publications", name: "Публикации строками", was: "Publications · library", make: () => sec("white", "1-2", [[b("heading", { eyebrow: "off", level: "h3" }, { title: "Recent publications" })], [b("list", { source: "publications", view: "rows", count: "4" })]], { valign: "top" }) },
];

export const START: string[] = ["hero-image", "numbers", "text-media", "steps", "tabs", "cta"];
