/**
 * CURRENCY ENGINE — conversión de moneda y costo de importación (spec §15,
 * fórmulas 6.3/21.13). Determinístico y puro, mismas reglas que los demás
 * motores (spec §27): sin I/O, sin tipos de cambio "adivinados" — siempre
 * recibe la tasa como input explícito.
 */

/** Fórmula 21.13: Monto destino = Monto origen × Tipo de Cambio. */
export function convertAmount(amountInOrigin: number, exchangeRate: number): number {
  return amountInOrigin * exchangeRate;
}

export interface ImportCostInputs {
  /** Costo FOB, flete y seguro, en la moneda de origen del proveedor. */
  fobCost: number;
  freight: number;
  insurance: number;
  /** % de arancel aplicado sobre FOB+Flete+Seguro. */
  tariffPct: number;
  /** Tipo de cambio moneda de origen → moneda funcional. */
  exchangeRate: number;
  /** Gastos de nacionalización, ya en moneda funcional. */
  nationalizationFees: number;
  /** Comisión bancaria, ya en moneda funcional. */
  bankFee: number;
}

export interface ImportCostResult {
  subtotalOrigin: number;
  subtotalWithTariff: number;
  subtotalFunctional: number;
  totalFunctional: number;
}

/**
 * Fórmula 6.3/21.13:
 *   Costo total importación (moneda funcional) =
 *     (Costo FOB + Flete + Seguro) × (1 + % Arancel) × Tipo de Cambio
 *     + Gastos de nacionalización + Comisión bancaria
 */
export function computeImportCost(inputs: ImportCostInputs): ImportCostResult {
  const subtotalOrigin = inputs.fobCost + inputs.freight + inputs.insurance;
  const subtotalWithTariff = subtotalOrigin * (1 + inputs.tariffPct / 100);
  const subtotalFunctional = subtotalWithTariff * inputs.exchangeRate;
  const totalFunctional = subtotalFunctional + inputs.nationalizationFees + inputs.bankFee;
  return { subtotalOrigin, subtotalWithTariff, subtotalFunctional, totalFunctional };
}

/** Convierte el costo total de un lote/embarque importado a costo por unidad. */
export function importCostPerUnit(result: ImportCostResult, quantity: number): number {
  return quantity > 0 ? result.totalFunctional / quantity : 0;
}

/**
 * Exposición cambiaria (spec §15.5): % de los costos totales que están
 * denominados en una moneda distinta a la funcional (ej. insumos importados).
 */
export function computeCurrencyExposurePct(totalCostsFunctional: number, importedCostsFunctional: number): number {
  return totalCostsFunctional > 0 ? (importedCostsFunctional / totalCostsFunctional) * 100 : 0;
}
