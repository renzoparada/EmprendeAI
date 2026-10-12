"use server";

import { requireCompany } from "@/lib/actions/guard";
import { generateAlertExplanation, type AlertExplanation } from "@/lib/ai/alert-narrative";

export interface AlertExplanationResult {
  explanation: AlertExplanation | null;
  error?: string;
}

export async function explainAlert(alertMessage: string, baseRecommendation: string): Promise<AlertExplanationResult> {
  const { company } = await requireCompany();

  const { explanation, missingData } = await generateAlertExplanation({
    companyName: company.name,
    currency: company.currency,
    alertMessage,
    baseRecommendation,
  });

  if (!explanation) return { explanation: null, error: missingData.join(" ") || "No se pudo generar la explicación." };

  return { explanation };
}
