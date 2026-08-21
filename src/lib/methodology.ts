/**
 * FUNDAMENTO TEÓRICO — "Metodología" (spec §22). Texto fijo, sin IA: explica
 * en lenguaje simple de dónde viene cada modelo que usa la plataforma, para
 * que cualquier resultado numérico pueda enlazar aquí vía "Ver metodología"
 * (spec §22: "todo resultado numérico enlaza a esta sección"). Fuente única
 * — los componentes que ya citaban metodología de valoración (Valoración)
 * reusan estas mismas entradas en vez de duplicar el texto.
 */

export type MethodologyTopicId =
  | "COSTO_VOLUMEN_UTILIDAD"
  | "VALOR_DINERO_TIEMPO"
  | "CAPM_WACC"
  | "DCF"
  | "MULTIPLOS"
  | "CAPITALIZACION_UTILIDADES"
  | "BERKUS"
  | "SCORECARD"
  | "VC_METHOD"
  | "ELASTICIDAD_PRECIO"
  | "CAC_LTV";

export interface MethodologyTopic {
  id: MethodologyTopicId;
  title: string;
  /** Módulos de la plataforma donde se aplica — para que el lector ubique el contexto. */
  usedIn: string[];
  explanation: string;
  formula: string;
  /** Cita académica cuando corresponde — nunca inventada, solo la que la spec §22 nombra. */
  reference?: string;
}

export const METHODOLOGY_TOPICS: MethodologyTopic[] = [
  {
    id: "COSTO_VOLUMEN_UTILIDAD",
    title: "Costo-Volumen-Utilidad (Punto de Equilibrio)",
    usedIn: ["Mi Negocio", "Estructura de Costos", "Dashboard", "Escenarios", "Mis Metas"],
    explanation:
      "Es un pilar clásico de la contabilidad gerencial: separa los costos de un negocio en fijos (no cambian con el volumen de ventas — alquiler, sueldos administrativos) y variables (cambian proporcionalmente con cada venta — materia prima, comisiones). Con esa separación se puede calcular exactamente cuánto hay que vender para cubrir todos los costos sin ganar ni perder dinero: el punto de equilibrio. Es la base de casi todos los cálculos de rentabilidad de la plataforma.",
    formula: "Fórmulas 21.1 (márgenes) y 21.2 (punto de equilibrio).",
  },
  {
    id: "VALOR_DINERO_TIEMPO",
    title: "Valor del dinero en el tiempo (VAN, TIR)",
    usedIn: ["Inversión Inicial", "Dashboard para Inversores", "Valoración (DCF)"],
    explanation:
      'Un dólar (o boliviano) hoy vale más que uno mañana, porque el de hoy se puede invertir y generar un retorno mientras tanto. Por eso, para comparar un desembolso de capital hoy contra flujos de caja que vas a recibir en el futuro, esos flujos futuros se "descuentan" — se reducen a lo que valdrían si los tuvieras hoy, usando una tasa que refleja el riesgo del negocio. El VAN (Valor Actual Neto) y la TIR (Tasa Interna de Retorno) son las dos formas más comunes de aplicar esta idea a una decisión de inversión: VAN positivo significa que el proyecto crea valor a esa tasa; la TIR es la tasa a la que el VAN se vuelve exactamente cero.',
    formula: "Fórmula 21.4.",
    reference: "Línea de valoración corporativa moderna, popularizada académicamente por autores como Aswath Damodaran (NYU Stern).",
  },
  {
    id: "CAPM_WACC",
    title: "CAPM y WACC",
    usedIn: ["Valoración (DCF)"],
    explanation:
      "El CAPM (Capital Asset Pricing Model) es el estándar de finanzas corporativas para estimar cuánto retorno debería exigir un inversionista por poner su capital en un negocio, según el riesgo de ese negocio comparado con el mercado en general. El WACC (Costo de Capital Promedio Ponderado) extiende esa idea a toda la estructura de capital de la empresa, combinando el costo del capital propio (vía CAPM) con el costo de la deuda, ponderado por cuánto pesa cada uno sobre el total. El WACC es la tasa que usa el método DCF para traer los flujos futuros a valor presente.",
    formula: "Fórmula 21.5.",
  },
  {
    id: "DCF",
    title: "Flujo de Caja Descontado (DCF)",
    usedIn: ["Valoración"],
    explanation:
      "Se proyectan los flujos de caja libres futuros del negocio y se descuentan a valor presente usando el WACC. Es el estándar de valoración corporativa moderna para negocios con ingresos y flujos predecibles.",
    formula: "Fórmula 21.6.",
    reference: "Popularizado académicamente por autores como Aswath Damodaran.",
  },
  {
    id: "MULTIPLOS",
    title: "Múltiplos comparables",
    usedIn: ["Valoración"],
    explanation:
      "Se estima el valor del negocio comparándolo con transacciones o empresas similares (EV/EBITDA, EV/Ventas, P/E). Solo es confiable si los múltiplos vienen de comparables reales de tu sector y etapa — la plataforma nunca inventa un múltiplo.",
    formula: "Fórmula 21.7.",
  },
  {
    id: "CAPITALIZACION_UTILIDADES",
    title: "Capitalización de utilidades",
    usedIn: ["Valoración"],
    explanation:
      "Divide la utilidad neta anual entre una tasa de capitalización (aquí, el WACC), asumiendo que la utilidad actual se mantiene a perpetuidad sin crecimiento. Es una simplificación del DCF útil para negocios maduros y estables, donde proyectar un crecimiento explícito agregaría más incertidumbre que precisión.",
    formula: "Deriva del mismo principio que el DCF, con crecimiento cero.",
  },
  {
    id: "BERKUS",
    title: "Método Berkus",
    usedIn: ["Valoración (etapa temprana)"],
    explanation:
      "Para startups sin historial financiero suficiente para un DCF confiable. Asigna un valor monetario (con un tope) a cinco factores cualitativos: idea, prototipo, calidad del equipo, relaciones estratégicas y ventas iniciales. Muy usado en rondas ángel/semilla.",
    formula: "Fórmula 21.8.",
  },
  {
    id: "SCORECARD",
    title: "Scorecard Method",
    usedIn: ["Valoración (etapa temprana)"],
    explanation:
      "Parte de la valoración promedio de startups comparables en la misma región/sector y la ajusta según qué tan por encima o por debajo del promedio está tu startup en factores como equipo, oportunidad, producto y competencia.",
    formula: "Fórmula 21.8.",
    reference: "Bill Payne.",
  },
  {
    id: "VC_METHOD",
    title: "Venture Capital Method",
    usedIn: ["Valoración (etapa temprana)"],
    explanation:
      "Parte del valor de salida (exit) proyectado a futuro, lo descuenta por el múltiplo de retorno que exige el inversionista, y de ahí calcula cuánto vale la empresa hoy (post-money) y qué porcentaje debe ceder por la inversión.",
    formula: "Fórmula 21.8.",
    reference: "Asociado académicamente a Bill Sahlman (Harvard Business School).",
  },
  {
    id: "ELASTICIDAD_PRECIO",
    title: "Elasticidad precio",
    usedIn: ["Precificación Inteligente"],
    explanation:
      "Es un concepto de microeconomía clásica que mide qué tan sensible es la demanda de un producto a cambios en su precio: si subes el precio un 10%, ¿cuánto baja la cantidad que la gente compra? Un producto con demanda elástica pierde muchas ventas si sube el precio (suele tener sustitutos cercanos); uno con demanda inelástica pierde pocas. La plataforma ajusta una curva de demanda a partir de los precios y cantidades históricas que cargaste, y solo la muestra si hay suficientes datos reales — nunca inventa una curva.",
    formula: "Fórmula 21.11.",
  },
  {
    id: "CAC_LTV",
    title: "CAC y LTV",
    usedIn: ["Ventas / Embudo", "Biblioteca de KPIs"],
    explanation:
      "CAC (Costo de Adquisición de Cliente) y LTV (Valor de Vida del Cliente) son métricas estándar del mundo de negocios digitales y SaaS. El CAC mide cuánto cuesta, en promedio, conseguir un cliente nuevo. El LTV estima cuánto va a generar ese cliente a lo largo de toda su relación con el negocio. La relación LTV/CAC es uno de los indicadores de salud más citados para negocios con clientes recurrentes: un valor de 3x o más generalmente se considera saludable.",
    formula: "Fórmula 21.12.",
  },
];

export const METHODOLOGY_TOPIC_BY_ID: Record<MethodologyTopicId, MethodologyTopic> = Object.fromEntries(
  METHODOLOGY_TOPICS.map((t) => [t.id, t])
) as Record<MethodologyTopicId, MethodologyTopic>;
