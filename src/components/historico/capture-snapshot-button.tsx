"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { captureSnapshotNow } from "@/lib/actions/snapshot-actions";
import { Button } from "@/components/ui/button";

export function CaptureSnapshotButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await captureSnapshotNow();
      if (!result.success) setError(result.error ?? "No se pudo capturar el snapshot.");
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
        <RefreshCw className="h-4 w-4" />
        {isPending ? "Capturando..." : "Actualizar snapshot de este mes"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
