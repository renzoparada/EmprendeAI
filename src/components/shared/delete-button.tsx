"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  id,
  action,
  confirmMessage = "¿Eliminar este registro? Esta acción no se puede deshacer.",
}: {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
