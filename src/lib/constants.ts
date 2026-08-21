/** Labels en español para los enums del modelo de datos — spec §1. */

export const USER_TYPE_LABELS: Record<string, string> = {
  EMPRENDEDOR: "Emprendedor",
  PROFESIONAL_INDEPENDIENTE: "Profesional independiente",
  STARTUP: "Startup",
  PYME: "PyME",
  EMPRESA_ESTABLECIDA: "Empresa establecida",
  FRANQUICIA: "Franquicia",
  INVERSIONISTA: "Inversionista",
};

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  RESTAURANTE: "Restaurante",
  HOTEL: "Hotel",
  TURISMO: "Turismo",
  COMERCIO: "Comercio",
  ECOMMERCE: "E-commerce",
  SERVICIOS: "Servicios",
  CONSULTORIA: "Consultoría",
  EDUCACION: "Educación",
  INMOBILIARIO: "Inmobiliario",
  MANUFACTURA: "Manufactura",
  TECNOLOGIA: "Tecnología",
  SALUD: "Salud",
  BELLEZA: "Belleza",
  TRANSPORTE: "Transporte",
  AGRICULTURA: "Agricultura",
  OTRO: "Otro",
};

export const OPERATING_STAGE_LABELS: Record<string, string> = {
  OPERANDO: "Sí, ya está funcionando",
  NO_OPERANDO: "No, todavía no",
  ETAPA_IDEA: "Etapa de idea",
};

export const CURRENCY_OPTIONS = ["BOB", "USD", "EUR", "BRL", "MXN", "COP", "PEN", "CLP", "ARS"];

export const FIXED_COST_CATEGORY_LABELS: Record<string, string> = {
  ALQUILER: "Alquiler",
  SUELDOS: "Sueldos",
  SERVICIOS: "Servicios",
  SOFTWARE: "Software",
  SEGUROS: "Seguros",
  ADMINISTRACION: "Administración",
  MARKETING: "Marketing",
  OTROS: "Otros",
};

export const VARIABLE_COST_CATEGORY_LABELS: Record<string, string> = {
  MATERIA_PRIMA: "Materia prima",
  COMISIONES: "Comisiones",
  EMPAQUE: "Empaque",
  TRANSPORTE: "Transporte",
  PRODUCCION: "Costos de producción",
  TRANSACCION: "Costos por transacción",
  OTROS: "Otros",
};

export const INVESTMENT_CATEGORY_LABELS: Record<string, string> = {
  EQUIPAMIENTO: "Equipamiento",
  INFRAESTRUCTURA: "Infraestructura",
  TECNOLOGIA: "Tecnología",
  MOBILIARIO: "Mobiliario",
  VEHICULOS: "Vehículos",
  LICENCIAS: "Licencias",
  MARKETING_INICIAL: "Marketing inicial",
  CAPITAL_DE_TRABAJO: "Capital de trabajo",
  GASTOS_PREOPERATIVOS: "Gastos preoperativos",
  OTROS: "Otros",
};

export const SCENARIO_TYPE_LABELS: Record<string, string> = {
  PESIMISTA: "Pesimista",
  BASE: "Base",
  OPTIMISTA: "Optimista",
};

/** Secciones cualitativas del Business Plan con IA (spec §18). */
export const BUSINESS_PLAN_SECTION_LABELS: Record<string, string> = {
  RESUMEN_EJECUTIVO: "Resumen ejecutivo",
  PROBLEMA: "Problema",
  SOLUCION: "Solución",
  PRODUCTO: "Producto / Servicio",
  MERCADO: "Mercado",
  CLIENTE_OBJETIVO: "Cliente objetivo",
  MODELO_NEGOCIO: "Modelo de negocio",
  COMPETENCIA: "Competencia",
  MARKETING: "Marketing",
  VENTAS: "Ventas",
  OPERACIONES: "Operaciones",
  EQUIPO: "Equipo",
  ESTRATEGIA: "Estrategia",
};

/** Financiamiento (spec §14). */
export const FINANCING_TYPE_LABELS: Record<string, string> = {
  PRESTAMO_BANCARIO: "Préstamo bancario",
  SOCIOS: "Aporte de socios",
  INVERSIONISTA: "Inversionista",
  CROWDFUNDING: "Crowdfunding",
  CAPITAL_PROPIO: "Capital propio",
};

export const GRACE_TYPE_LABELS: Record<string, string> = {
  NINGUNA: "Sin período de gracia",
  SOLO_INTERES: "Gracia — solo interés",
  TOTAL: "Gracia total (capitaliza interés)",
};

export const BUSINESS_PLAN_SECTION_ORDER = [
  "RESUMEN_EJECUTIVO",
  "PROBLEMA",
  "SOLUCION",
  "PRODUCTO",
  "MERCADO",
  "CLIENTE_OBJETIVO",
  "MODELO_NEGOCIO",
  "COMPETENCIA",
  "MARKETING",
  "VENTAS",
  "OPERACIONES",
  "EQUIPO",
  "ESTRATEGIA",
] as const;
