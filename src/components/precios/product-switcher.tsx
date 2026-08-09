"use client";

import { useRouter } from "next/navigation";
import type { Product } from "@prisma/client";
import { Label } from "@/components/ui/label";

export function ProductSwitcher({ products, selectedId }: { products: Product[]; selectedId?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="product-switcher">Producto/servicio</Label>
      <select
        id="product-switcher"
        value={selectedId}
        onChange={(e) => router.push(`/precios?productId=${e.target.value}`)}
        className="h-10 w-64 rounded-md border border-slate-300 bg-white px-3 text-sm"
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
