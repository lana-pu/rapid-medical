"use client";

import type { FieldDef } from "@/admin/fields";
import type { Product } from "@/db/schema";
import { Field } from "./ResourceForm";

export function SettingsFields({ fields, value, products }: { fields: FieldDef[]; value: Record<string, unknown>; products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 @xl:grid-cols-2">
      {fields.map((f) => (
        <Field key={f.name} f={f} value={value[f.name]} products={products} />
      ))}
    </div>
  );
}
