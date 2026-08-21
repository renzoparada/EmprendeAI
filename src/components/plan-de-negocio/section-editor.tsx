"use client";

import { useActionState, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import type { BusinessPlanSectionKey } from "@prisma/client";
import { saveBusinessPlanSection, generateDraftForSection } from "@/lib/actions/business-plan-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

export function SectionEditor({
  sectionKey,
  label,
  description,
  initialContent,
}: {
  sectionKey: BusinessPlanSectionKey;
  label: string;
  description: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [state, formAction, isSaving] = useActionState(saveBusinessPlanSection, initialState);
  const [isDrafting, startDrafting] = useTransition();
  const [draftError, setDraftError] = useState<string | null>(null);

  const handleDraft = () => {
    setDraftError(null);
    startDrafting(async () => {
      const res = await generateDraftForSection(sectionKey);
      if (res.draft) {
        setContent(res.draft.draft);
      } else {
        setDraftError(res.error ?? "No se pudo generar el borrador.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleDraft} disabled={isDrafting}>
            <Sparkles className="h-4 w-4" />
            {isDrafting ? "Redactando..." : "Ayúdame a redactar con IA"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="key" value={sectionKey} />
          <Textarea name="content" value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Escribe aquí o pide un borrador con IA..." />
          {draftError && <p className="text-sm text-amber-700">{draftError}</p>}
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar sección"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
