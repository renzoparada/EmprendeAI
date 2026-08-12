import type { ValuationMethod } from "@/lib/engine/valuation";

/** Fundamento teórico por método (spec §22 "Metodología") — texto fijo, sin IA. */
export const METHODOLOGY_TEXT: Record<ValuationMethod, string> = {
  DCF: "Flujo de Caja Descontado: un dólar hoy vale más que uno mañana. Se proyectan los flujos de caja libres futuros del negocio y se descuentan a valor presente usando el WACC (costo de capital ponderado). Es el estándar de valoración corporativa moderna, popularizado académicamente por autores como Aswath Damodaran. Fórmula 21.6.",
  MULTIPLOS: "Múltiplos comparables: se estima el valor del negocio comparándolo con transacciones o empresas similares (EV/EBITDA, EV/Ventas, P/E). Solo es confiable si los múltiplos vienen de comparables reales de tu sector y etapa — la plataforma nunca inventa un múltiplo. Fórmula 21.7.",
  CAPITALIZACION_UTILIDADES: "Capitalización de utilidades: divide la utilidad neta anual entre una tasa de capitalización (aquí, el WACC), asumiendo que la utilidad actual se mantiene a perpetuidad sin crecimiento. Es una simplificación del DCF útil para negocios maduros y estables.",
  BERKUS: "Método Berkus: para startups sin historial financiero suficiente para un DCF confiable. Asigna un valor monetario (con tope) a cinco factores cualitativos: idea, prototipo, calidad del equipo, relaciones estratégicas y ventas iniciales. Muy usado en rondas ángel/semilla. Fórmula 21.8.",
  SCORECARD: "Scorecard Method (Bill Payne): parte de la valoración promedio de startups comparables en la misma región/sector y la ajusta según qué tan por encima o por debajo del promedio está tu startup en factores como equipo, oportunidad, producto y competencia. Fórmula 21.8.",
  VC_METHOD: "Venture Capital Method: asociado académicamente a Bill Sahlman (Harvard Business School). Parte del valor de salida (exit) proyectado a futuro, lo descuenta por el múltiplo de retorno que exige el inversionista, y de ahí calcula cuánto vale la empresa hoy (post-money) y qué % debe ceder por la inversión. Fórmula 21.8.",
};
